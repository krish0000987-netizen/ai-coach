import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth-utils";

// POST /api/reminders/scan — deterministic date-based predictive scan
export async function POST(req: NextRequest) {
  const session = await getUserFromRequest(req);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.userId;
  const now = new Date();
  const createdReminders: any[] = [];

  try {
    // 1. Scan Documents for upcoming or passed Expiry Dates
    const documents = await db.document.findMany({
      where: {
        userId,
        expiryDate: { not: null },
      },
    });

    for (const doc of documents) {
      if (!doc.expiryDate) continue;
      const expDate = new Date(doc.expiryDate);
      const diffMs = expDate.getTime() - now.getTime();
      const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

      // Expired
      if (diffDays <= 0) {
        const exists = await db.reminder.findFirst({
          where: { userId, documentId: doc.id, type: "expiry", status: "pending" },
        });
        if (!exists) {
          const r = await db.reminder.create({
            data: {
              userId,
              documentId: doc.id,
              title: `EXPIRED: ${doc.title}`,
              description: `This document (${doc.documentType}) expired on ${expDate.toLocaleDateString()}. Please upload an updated version.`,
              category: doc.category,
              type: "expiry",
              remindAt: now,
              dueDate: expDate,
            },
          });
          createdReminders.push(r);
        }
      }
      // Expiring in <= 30 days
      else if (diffDays <= 30) {
        const exists = await db.reminder.findFirst({
          where: { userId, documentId: doc.id, type: "expiry" },
        });
        if (!exists) {
          const r = await db.reminder.create({
            data: {
              userId,
              documentId: doc.id,
              title: `Renewal Alert: ${doc.title} expires in ${diffDays} day${diffDays === 1 ? "" : "s"}`,
              description: `Your ${doc.category.replace("_", " ")} document expires on ${expDate.toLocaleDateString()}. Plan renewal soon.`,
              category: doc.category,
              type: "expiry",
              remindAt: now,
              dueDate: expDate,
            },
          });
          createdReminders.push(r);
        }
      }
    }

    // 2. Scan Health Category for Stale Checkups (if no health item updated in 60+ days)
    const latestHealth = await db.item.findFirst({
      where: {
        userId,
        domain: { key: { in: ["health_wellness", "health"] } },
      },
      orderBy: { updatedAt: "desc" },
    });

    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(now.getDate() - 60);

    if (!latestHealth || new Date(latestHealth.updatedAt) < sixtyDaysAgo) {
      const existingHealthReminder = await db.reminder.findFirst({
        where: { userId, type: "health_check", status: "pending" },
      });
      if (!existingHealthReminder) {
        const r = await db.reminder.create({
          data: {
            userId,
            title: "Preventative Wellness Check",
            description: "You haven't logged a health update or medical record in over 60 days. Consider scheduling your annual screening.",
            category: "health_wellness",
            type: "health_check",
            remindAt: now,
          },
        });
        createdReminders.push(r);
      }
    }

    // 3. Scan Overdue Goals
    const overdueGoals = await db.item.findMany({
      where: {
        userId,
        type: "goal",
        status: { in: ["active", "inbox"] },
        dueDate: { lt: now },
      },
      take: 5,
    });

    for (const goal of overdueGoals) {
      if (!goal.dueDate) continue;
      const exists = await db.reminder.findFirst({
        where: { userId, itemId: goal.id, type: "goal_due" },
      });
      if (!exists) {
        const r = await db.reminder.create({
          data: {
            userId,
            itemId: goal.id,
            title: `Goal Target Date Passed: ${goal.title}`,
            description: `Target date was ${new Date(goal.dueDate).toLocaleDateString()}. Review progress with your Life Coach or adjust timeline.`,
            category: "daily_personal",
            type: "goal_due",
            remindAt: now,
            dueDate: goal.dueDate,
          },
        });
        createdReminders.push(r);
      }
    }

    return NextResponse.json({
      success: true,
      scannedAt: now.toISOString(),
      createdCount: createdReminders.length,
      newReminders: createdReminders,
    });
  } catch (err: any) {
    console.error("POST /api/reminders/scan error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
