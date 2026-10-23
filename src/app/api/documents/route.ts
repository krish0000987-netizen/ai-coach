import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth-utils";

// GET /api/documents?category=...&type=...&q=...&expiring=true
export async function GET(req: NextRequest) {
  const session = await getUserFromRequest(req);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category");
  const documentType = searchParams.get("type");
  const q = searchParams.get("q");
  const expiring = searchParams.get("expiring");

  try {
    const where: any = { userId: session.userId };

    if (category && category !== "all") {
      where.category = category;
    }

    if (documentType && documentType !== "all") {
      where.documentType = documentType;
    }

    if (q) {
      where.OR = [
        { title: { contains: q, mode: "insensitive" } },
        { description: { contains: q, mode: "insensitive" } },
        { tags: { contains: q, mode: "insensitive" } },
        { extractedText: { contains: q, mode: "insensitive" } },
        { fileName: { contains: q, mode: "insensitive" } },
      ];
    }

    if (expiring === "true") {
      const now = new Date();
      const in90Days = new Date();
      in90Days.setDate(now.getDate() + 90);
      where.expiryDate = {
        not: null,
        lte: in90Days,
      };
    }

    const documents = await db.document.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    // Compute storage stats for user
    const totalSize = documents.reduce((sum, d) => sum + d.fileSize, 0);

    return NextResponse.json({
      documents,
      count: documents.length,
      totalSizeBytes: totalSize,
    });
  } catch (err: any) {
    console.error("GET /api/documents error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
