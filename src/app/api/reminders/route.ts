import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth-utils";

// GET /api/reminders — list user's reminders
export async function GET(req: NextRequest) {
  const session = await getUserFromRequest(req);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const reminders = await db.reminder.findMany({
      where: { userId: session.userId },
      include: {
        document: {
          select: { id: true, title: true, category: true, documentType: true, expiryDate: true },
        },
        item: {
          select: { id: true, title: true, type: true, dueDate: true },
        },
      },
      orderBy: { remindAt: "asc" },
    });

    const now = new Date();
    const in7Days = new Date();
    in7Days.setDate(now.getDate() + 7);

    // Group reminders
    const overdue = reminders.filter((r) => r.status === "pending" && new Date(r.remindAt) < now);
    const dueSoon = reminders.filter(
      (r) => r.status === "pending" && new Date(r.remindAt) >= now && new Date(r.remindAt) <= in7Days
    );
    const upcoming = reminders.filter(
      (r) => r.status === "pending" && new Date(r.remindAt) > in7Days
    );
    const completed = reminders.filter((r) => r.status === "completed");

    return NextResponse.json({
      all: reminders,
      overdue,
      dueSoon,
      upcoming,
      completed,
      stats: {
        total: reminders.length,
        overdueCount: overdue.length,
        dueSoonCount: dueSoon.length,
        completedCount: completed.length,
      },
    });
  } catch (err: any) {
    console.error("GET /api/reminders error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST /api/reminders — create reminder
export async function POST(req: NextRequest) {
  const session = await getUserFromRequest(req);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { title, description, category, type = "custom", remindAt, dueDate, documentId, itemId } = body;

    if (!title || !remindAt) {
      return NextResponse.json({ error: "Title and remindAt date are required" }, { status: 400 });
    }

    const reminder = await db.reminder.create({
      data: {
        userId: session.userId,
        title,
        description,
        category,
        type,
        remindAt: new Date(remindAt),
        dueDate: dueDate ? new Date(dueDate) : null,
        documentId: documentId || null,
        itemId: itemId || null,
      },
    });

    return NextResponse.json(reminder);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
