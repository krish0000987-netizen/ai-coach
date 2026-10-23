import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth-utils";

export interface TimelineEntry {
  id: string;
  source: "item" | "document";
  title: string;
  category: string;
  categoryName: string;
  date: string;
  type: string;
  description?: string;
  status?: string;
  tags?: string[];
  isMilestone: boolean;
  meta?: any;
}

export async function GET(req: NextRequest) {
  const session = await getUserFromRequest(req);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const categoryFilter = searchParams.get("category");

  try {
    const userId = session.userId;

    // 1. Fetch relevant Items
    const items = await db.item.findMany({
      where: {
        userId,
        OR: [
          { type: { in: ["milestone", "event", "goal", "journal"] } },
          { startDate: { not: null } },
          { completedAt: { not: null } },
        ],
      },
      include: {
        domain: true,
      },
      orderBy: { createdAt: "desc" },
    });

    // 2. Fetch relevant Documents
    const documents = await db.document.findMany({
      where: {
        userId,
        OR: [
          { issueDate: { not: null } },
          { expiryDate: { not: null } },
        ],
      },
      orderBy: { createdAt: "desc" },
    });

    const entries: TimelineEntry[] = [];

    // Map items
    for (const item of items) {
      const date = item.completedAt || item.startDate || item.scheduledAt || item.dueDate || item.createdAt;
      const catKey = item.domain?.key || "daily_personal";
      const catName = item.domain?.name || "Daily Life";

      if (categoryFilter && categoryFilter !== "all" && catKey !== categoryFilter) {
        continue;
      }

      entries.push({
        id: item.id,
        source: "item",
        title: item.title,
        category: catKey,
        categoryName: catName,
        date: new Date(date).toISOString(),
        type: item.type,
        description: item.content || undefined,
        status: item.status,
        isMilestone: item.type === "milestone" || item.type === "goal",
      });
    }

    // Map documents
    for (const doc of documents) {
      const date = doc.issueDate || doc.createdAt;
      const catKey = doc.category || "legal_government";

      if (categoryFilter && categoryFilter !== "all" && catKey !== categoryFilter) {
        continue;
      }

      entries.push({
        id: doc.id,
        source: "document",
        title: `${doc.title} (${doc.documentType.replace(/_/g, " ")})`,
        category: catKey,
        categoryName: catKey.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
        date: new Date(date).toISOString(),
        type: "document",
        description: doc.description || undefined,
        status: "verified",
        isMilestone: true,
        meta: {
          expiryDate: doc.expiryDate ? new Date(doc.expiryDate).toISOString() : null,
          fileName: doc.fileName,
        },
      });
    }

    // Sort chronologically (earliest to latest)
    entries.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Fetch user birthdate from profile/settings if available
    const setting = await db.setting.findUnique({
      where: { id: `profile-${userId}` },
    });
    let birthDate = null;
    if (setting) {
      try {
        const profile = JSON.parse(setting.value);
        birthDate = profile.birthDate || null;
      } catch {}
    }

    return NextResponse.json({
      entries,
      birthDate,
      totalCount: entries.length,
    });
  } catch (err: any) {
    console.error("GET /api/timeline error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
