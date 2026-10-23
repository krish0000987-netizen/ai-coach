import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getUserFromRequest } from "@/lib/auth-utils";
import { seedDatabase } from "@/lib/seed";

export const dynamic = "force-dynamic";

// POST /api/seed — seeds demo data for authenticated user or demo user
export async function POST(req: NextRequest) {
  try {
    const session = await getUserFromRequest(req);
    await seedDatabase(session?.userId);
    return NextResponse.json({ success: true, message: "Database seeded successfully" });
  } catch (err: any) {
    console.error("POST /api/seed error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
