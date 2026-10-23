import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth-utils";
import { getSupabaseAdmin } from "@/lib/supabase";
import crypto from "crypto";

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "text/plain",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

export async function POST(req: NextRequest) {
  const session = await getUserFromRequest(req);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const title = (formData.get("title") as string) || "";
    const description = (formData.get("description") as string) || "";
    const category = (formData.get("category") as string) || "health_wellness";
    const documentType = (formData.get("documentType") as string) || "medical_report";
    const issueDateStr = formData.get("issueDate") as string | null;
    const expiryDateStr = formData.get("expiryDate") as string | null;
    const tags = (formData.get("tags") as string) || "";
    const notes = (formData.get("notes") as string) || "";
    const isSensitive = formData.get("isSensitive") !== "false";

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Size validation
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File size exceeds 50MB limit (${(file.size / (1024 * 1024)).toFixed(1)}MB)` },
        { status: 400 }
      );
    }

    // MIME type validation
    if (!ALLOWED_MIME_TYPES.includes(file.type) && !file.name.endsWith(".txt")) {
      return NextResponse.json(
        { error: `Unsupported file type: ${file.type}. Allowed: PDF, PNG, JPG, WebP, DOCX, TXT` },
        { status: 400 }
      );
    }

    const documentId = "doc_" + crypto.randomBytes(12).toString("hex");
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const storagePath = `${session.userId}/${documentId}/${sanitizedFileName}`;

    // Read file buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to Supabase Storage private "vault" bucket
    const supabase = getSupabaseAdmin();
    const { error: uploadError } = await supabase.storage
      .from("vault")
      .upload(storagePath, buffer, {
        contentType: file.type || "application/octet-stream",
        upsert: true,
      });

    if (uploadError) {
      console.error("Supabase Storage upload error:", uploadError);
      return NextResponse.json({ error: "Failed to upload file to storage vault: " + uploadError.message }, { status: 500 });
    }

    // Text Extraction
    let extractedText = "";
    let extractionStatus = "completed";

    try {
      if (file.type === "application/pdf" || file.name.endsWith(".pdf")) {
        const pdfModule = await import("pdf-parse");
        const pdfParse = (pdfModule as any).default || pdfModule;
        const parsed = await pdfParse(buffer);
        extractedText = parsed.text ? parsed.text.slice(0, 15000) : "";
      } else if (file.type.startsWith("text/") || file.name.endsWith(".txt")) {
        extractedText = buffer.toString("utf-8").slice(0, 15000);
      } else {
        extractionStatus = "unsupported"; // Images or binary without OCR service
      }
    } catch (parseErr: any) {
      console.warn("Text extraction warning:", parseErr?.message);
      extractionStatus = "failed";
    }

    const issueDate = issueDateStr ? new Date(issueDateStr) : null;
    const expiryDate = expiryDateStr ? new Date(expiryDateStr) : null;

    // Create Document record in database
    const doc = await db.document.create({
      data: {
        id: documentId,
        userId: session.userId,
        title: title || file.name,
        description,
        category,
        documentType,
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type || "application/octet-stream",
        storagePath,
        issueDate,
        expiryDate,
        tags,
        notes,
        extractedText: extractedText || null,
        extractionStatus,
        isSensitive,
      },
    });

    // If document has an expiry date, automatically create predictive reminders
    if (expiryDate && !isNaN(expiryDate.getTime())) {
      const now = new Date();
      // 30 days before
      const remind30 = new Date(expiryDate);
      remind30.setDate(remind30.getDate() - 30);

      if (remind30 > now) {
        await db.reminder.create({
          data: {
            userId: session.userId,
            documentId: doc.id,
            title: `Document Expiring Soon: ${doc.title}`,
            description: `Your ${doc.category.replace("_", " ")} document (${doc.documentType}) expires in 30 days.`,
            category: doc.category,
            type: "expiry",
            remindAt: remind30,
            dueDate: expiryDate,
          },
        });
      }

      // 7 days before
      const remind7 = new Date(expiryDate);
      remind7.setDate(remind7.getDate() - 7);
      if (remind7 > now) {
        await db.reminder.create({
          data: {
            userId: session.userId,
            documentId: doc.id,
            title: `URGENT: ${doc.title} expires in 7 days`,
            description: `Immediate renewal recommended for ${doc.title}.`,
            category: doc.category,
            type: "expiry",
            remindAt: remind7,
            dueDate: expiryDate,
          },
        });
      }
    }

    return NextResponse.json({
      success: true,
      document: doc,
    });
  } catch (err: any) {
    console.error("POST /api/documents/upload error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
