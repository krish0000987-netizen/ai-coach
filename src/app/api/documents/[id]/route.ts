import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth-utils";
import { getSupabaseAdmin } from "@/lib/supabase";

// GET /api/documents/[id] — get document details and private signed URL
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getUserFromRequest(req);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const doc = await db.document.findFirst({
      where: { id, userId: session.userId },
      include: { reminders: true },
    });

    if (!doc) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    // Generate signed URL (valid for 1 hour / 3600 seconds)
    const supabase = getSupabaseAdmin();
    const { data: signedData, error: signError } = await supabase.storage
      .from("vault")
      .createSignedUrl(doc.storagePath, 3600);

    return NextResponse.json({
      document: doc,
      signedUrl: signedData?.signedUrl || null,
      error: signError ? signError.message : null,
    });
  } catch (err: any) {
    console.error("GET /api/documents/[id] error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// PATCH /api/documents/[id] — update metadata
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
    const { title, description, category, documentType, issueDate, expiryDate, tags, notes } = body;

    const existing = await db.document.findFirst({
      where: { id, userId: session.userId },
    });

    if (!existing) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    const updated = await db.document.update({
      where: { id },
      data: {
        title: title !== undefined ? title : existing.title,
        description: description !== undefined ? description : existing.description,
        category: category !== undefined ? category : existing.category,
        documentType: documentType !== undefined ? documentType : existing.documentType,
        issueDate: issueDate !== undefined ? (issueDate ? new Date(issueDate) : null) : existing.issueDate,
        expiryDate: expiryDate !== undefined ? (expiryDate ? new Date(expiryDate) : null) : existing.expiryDate,
        tags: tags !== undefined ? tags : existing.tags,
        notes: notes !== undefined ? notes : existing.notes,
      },
    });

    return NextResponse.json(updated);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// DELETE /api/documents/[id] — remove file from storage and database
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
    const doc = await db.document.findFirst({
      where: { id, userId: session.userId },
    });

    if (!doc) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    // Delete from Supabase Storage private vault
    const supabase = getSupabaseAdmin();
    if (doc.storagePath) {
      const { error: removeError } = await supabase.storage
        .from("vault")
        .remove([doc.storagePath]);
      if (removeError) {
        console.warn("Storage removal warning:", removeError.message);
      }
    }

    // Delete record from database (cascades to reminders)
    await db.document.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("DELETE /api/documents/[id] error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
