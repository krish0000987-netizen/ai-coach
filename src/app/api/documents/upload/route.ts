import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth-utils";
import { getSupabaseAdmin } from "@/lib/supabase";
import crypto from "crypto";
import fs from "fs";
import path from "path";

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

export async function POST(req: NextRequest) {
  let session = await getUserFromRequest(req);
  let userId = session?.userId;
  if (!userId) {
    const firstUser = await db.user.findFirst();
    userId = firstUser?.id || "demo-user-life-coach-01";
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const title = (formData.get("title") as string) || "";
    const description = (formData.get("description") as string) || "";
    const category = (formData.get("category") as string) || "health_wellness";
    const documentType = (formData.get("documentType") as string) || "document";
    const issueDateStr = formData.get("issueDate") as string | null;
    const expiryDateStr = formData.get("expiryDate") as string | null;
    const tags = (formData.get("tags") as string) || "";
    const notes = (formData.get("notes") as string) || "";
    const isSensitive = formData.get("isSensitive") !== "false";
    const createItemRecord = formData.get("createItem") !== "false";

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

    const documentId = "doc_" + crypto.randomBytes(12).toString("hex");
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    let storagePath = `${userId}/${documentId}/${sanitizedFileName}`;
    let fileUrl = `/api/documents/${documentId}`;

    // Read file buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Attempt Supabase Storage private "vault" bucket, fallback to local storage
    let uploadedToCloud = false;
    try {
      const supabase = getSupabaseAdmin();
      const { error: uploadError } = await supabase.storage
        .from("vault")
        .upload(storagePath, buffer, {
          contentType: file.type || "application/octet-stream",
          upsert: true,
        });

      if (!uploadError) {
        uploadedToCloud = true;
      }
    } catch {
      // cloud unavailable, fallback to local
    }

    if (!uploadedToCloud) {
      // Local filesystem storage fallback
      const localDir = path.join(process.cwd(), "public", "uploads", "vault", userId, documentId);
      fs.mkdirSync(localDir, { recursive: true });
      const localFilePath = path.join(localDir, sanitizedFileName);
      fs.writeFileSync(localFilePath, buffer);
      storagePath = `local:${path.join("uploads", "vault", userId, documentId, sanitizedFileName)}`;
      fileUrl = `/uploads/vault/${userId}/${documentId}/${sanitizedFileName}`;
    }

    // Text Extraction attempt
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
        extractionStatus = "unsupported";
      }
    } catch {
      extractionStatus = "failed";
    }

    const issueDate = issueDateStr ? new Date(issueDateStr) : null;
    const expiryDate = expiryDateStr ? new Date(expiryDateStr) : null;

    // Create Document record in database
    const doc = await db.document.create({
      data: {
        id: documentId,
        userId,
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

    // Also find matching domain record
    const domainRecord = await db.domain.findFirst({
      where: { key: { in: [category, category.replace("_wellness", ""), category.replace("_money", "")] } },
    });

    // Auto-create Item of type "document" with attachments list matching user screenshots!
    let createdItem: any = null;
    if (createItemRecord) {
      const attachments = [
        {
          name: file.name,
          url: fileUrl,
          size: file.size,
          type: file.type,
          documentId: doc.id,
        },
      ];

      createdItem = await db.item.create({
        data: {
          userId,
          domainId: domainRecord?.id || null,
          type: "document",
          title: title || file.name,
          content: description || `Uploaded ${file.name} filed under ${category.replace(/_/g, " ")}.`,
          status: "active",
          priority: 0,
          metadata: JSON.stringify({
            attachments,
            documentId: doc.id,
            expiryDate: expiryDate ? expiryDate.toISOString() : null,
          }),
        },
      });
    }

    // If document has an expiry date, automatically create predictive reminders
    if (expiryDate && !isNaN(expiryDate.getTime())) {
      const now = new Date();
      // 30 days before
      const remind30 = new Date(expiryDate);
      remind30.setDate(remind30.getDate() - 30);

      if (remind30 > now) {
        await db.reminder.create({
          data: {
            userId,
            documentId: doc.id,
            itemId: createdItem?.id || null,
            title: `Document Expiring Soon: ${doc.title}`,
            description: `Your ${doc.category.replace(/_/g, " ")} document expires in 30 days.`,
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
            userId,
            documentId: doc.id,
            itemId: createdItem?.id || null,
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
      item: createdItem,
    });
  } catch (err: any) {
    console.error("POST /api/documents/upload error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
