import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth-utils";

// PATCH /api/reminders/[id] — snooze, complete, dismiss
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getUserFromRequest(req);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const body = await req.json();
    const { action, snoozeDays } = body; // action: 'complete' | 'dismiss' | 'snooze'

    const existing = await db.reminder.findFirst({
      where: { id, userId: session.userId },
    });

    if (!existing) {
      return NextResponse.json({ error: "Reminder not found" }, { status: 404 });
    }

    let updateData: any = {};
    if (action === "complete") {
      updateData.status = "completed";
    } else if (action === "dismiss") {
      updateData.status = "dismissed";
    } else if (action === "snooze") {
      const days = snoozeDays || 1;
      const newRemindAt = new Date();
      newRemindAt.setDate(newRemindAt.getDate() + days);
      updateData.remindAt = newRemindAt;
      updateData.status = "pending";
    }

    const updated = await db.reminder.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(updated);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// DELETE /api/reminders/[id]
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getUserFromRequest(req);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    await db.reminder.deleteMany({
      where: { id, userId: session.userId },
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
