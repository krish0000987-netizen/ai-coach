import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth-utils";
import { aiChatCompletion, getAIPrefs } from "@/lib/ai-provider";

// GET /api/coaches?coachType=health&conversationId=...
export async function GET(req: NextRequest) {
  const session = await getUserFromRequest(req);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const coachType = searchParams.get("coachType") || "unified";
  const conversationId = searchParams.get("conversationId");

  try {
    if (conversationId) {
      const conversation = await db.aICoachConversation.findFirst({
        where: { id: conversationId, userId: session.userId },
        include: {
          messages: {
            orderBy: { createdAt: "asc" },
          },
        },
      });
      return NextResponse.json(conversation || null);
    }

    // Get recent conversations for this coach
    const conversations = await db.aICoachConversation.findMany({
      where: { userId: session.userId, coachType },
      include: {
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
      orderBy: { updatedAt: "desc" },
      take: 10,
    });

    return NextResponse.json(conversations);
  } catch (err: any) {
    console.error("GET /api/coaches error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST /api/coaches
export async function POST(req: NextRequest) {
  const session = await getUserFromRequest(req);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { coachType = "unified", message, conversationId } = body;

    if (!message || typeof message !== "string") {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    // 1. Find or create conversation
    let conv: any = null;
    if (conversationId) {
      conv = await db.aICoachConversation.findFirst({
        where: { id: conversationId, userId: session.userId },
      });
    }

    if (!conv) {
      const title = message.slice(0, 45) + (message.length > 45 ? "…" : "");
      conv = await db.aICoachConversation.create({
        data: {
          userId: session.userId,
          coachType,
          title,
        },
      });
    }

    // 2. Save user message to database
    await db.aICoachMessage.create({
      data: {
        conversationId: conv.id,
        role: "user",
        content: message,
      },
    });

    // 3. Fetch recent conversation history
    const history = await db.aICoachMessage.findMany({
      where: { conversationId: conv.id },
      orderBy: { createdAt: "asc" },
      take: 10,
    });

    // 4. Fetch user context deeply grounded in this coach's category and life records
    // Find domain record if applicable
    const domainRecord = await db.domain.findFirst({
      where: { key: coachType },
      select: { id: true, name: true },
    });

    const [domainItems, domainDocs, generalItems, generalDocs, pendingReminders, userRecord] = await Promise.all([
      domainRecord
        ? db.item.findMany({
            where: { userId: session.userId, domainId: domainRecord.id, status: "active" },
            take: 8,
            orderBy: { updatedAt: "desc" },
            select: { type: true, title: true, dueDate: true, content: true },
          })
        : Promise.resolve([]),
      coachType !== "unified"
        ? db.document.findMany({
            where: {
              userId: session.userId,
              OR: [{ category: coachType }, { category: { startsWith: coachType.slice(0, 5) } }],
            },
            take: 8,
            orderBy: { createdAt: "desc" },
            select: { title: true, category: true, documentType: true, expiryDate: true, aiSummary: true },
          })
        : Promise.resolve([]),
      db.item.findMany({
        where: { userId: session.userId, status: "active" },
        take: 5,
        orderBy: { updatedAt: "desc" },
        select: { type: true, title: true, dueDate: true, content: true },
      }),
      db.document.findMany({
        where: { userId: session.userId },
        take: 6,
        orderBy: { createdAt: "desc" },
        select: { title: true, category: true, documentType: true, expiryDate: true, aiSummary: true },
      }),
      db.reminder.findMany({
        where: { userId: session.userId, status: "pending" },
        take: 6,
        orderBy: { remindAt: "asc" },
        select: { title: true, type: true, dueDate: true },
      }),
      db.user.findUnique({
        where: { id: session.userId },
        select: { name: true },
      }),
    ]);

    // Format category-focused records first, then general records
    const finalItems = domainItems.length > 0 ? domainItems : generalItems;
    const finalDocs = domainDocs.length > 0 ? domainDocs : generalDocs;

    const itemsSummary = finalItems
      .map((i) => `• [${i.type.toUpperCase()}] ${i.title}${i.dueDate ? ` (Target: ${new Date(i.dueDate).toLocaleDateString()})` : ""}${i.content ? ` - ${i.content.slice(0, 60)}` : ""}`)
      .join("\n");

    const documentsSummary = finalDocs
      .map((d) => `• [${d.category}] ${d.title} (${d.documentType})${d.expiryDate ? ` [Expires: ${new Date(d.expiryDate).toLocaleDateString()}]` : ""}${d.aiSummary ? ` - Summary: ${d.aiSummary.slice(0, 80)}` : ""}`)
      .join("\n");

    const remindersSummary = pendingReminders
      .map((r) => `• [${r.type}] ${r.title}${r.dueDate ? ` (Due: ${new Date(r.dueDate).toLocaleDateString()})` : ""}`)
      .join("\n");

    // 5. Generate AI completion
    const prefs = await getAIPrefs(req);
    const messages = history.map((m) => ({ role: m.role, content: m.content }));

    const aiReply = await aiChatCompletion(prefs, messages, coachType, {
      userName: userRecord?.name || session.email.split("@")[0],
      itemsSummary,
      documentsSummary,
      remindersSummary,
    });

    // 6. Save AI message to database
    const assistantMsg = await db.aICoachMessage.create({
      data: {
        conversationId: conv.id,
        role: "assistant",
        content: aiReply,
      },
    });

    // Update conversation timestamp
    await db.aICoachConversation.update({
      where: { id: conv.id },
      data: { updatedAt: new Date() },
    });

    return NextResponse.json({
      conversationId: conv.id,
      message: assistantMsg,
    });
  } catch (err: any) {
    console.error("POST /api/coaches error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// DELETE /api/coaches?conversationId=...
export async function DELETE(req: NextRequest) {
  const session = await getUserFromRequest(req);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const conversationId = searchParams.get("conversationId");

  if (!conversationId) {
    return NextResponse.json({ error: "conversationId is required" }, { status: 400 });
  }

  try {
    await db.aICoachConversation.deleteMany({
      where: { id: conversationId, userId: session.userId },
    });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
