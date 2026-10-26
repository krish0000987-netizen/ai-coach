import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth-utils";
import { seedDatabase } from "@/lib/seed";

export const dynamic = "force-dynamic";

// POST /api/seed — seeds demo data for authenticated user or demo user
export async function POST(req: NextRequest) {
  try {
    let session = await getUserFromRequest(req);
    let userId = session?.userId;
    if (!userId) {
      const firstUser = await db.user.findFirst();
      userId = firstUser?.id;
    }
    await seedDatabase(userId);
    return NextResponse.json({ success: true, message: "Database seeded successfully" });
  } catch (err: any) {
    console.error("POST /api/seed error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
