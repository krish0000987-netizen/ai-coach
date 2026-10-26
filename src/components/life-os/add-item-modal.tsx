"use client";

import { useState, useRef, useEffect } from "react";
import { DOMAINS, DOMAIN_MAP } from "@/lib/constants";
import { Icon } from "./icon";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface AddItemModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  domainKey: string;
  domainId?: string;
  defaultType?: "document" | "note" | "reminder" | "task";
  onSuccess?: () => void;
}

export function AddItemModal({
  open,
  onOpenChange,
  domainKey,
  domainId,
  defaultType = "note",
  onSuccess,
}: AddItemModalProps) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [itemType, setItemType] = useState<"document" | "note" | "reminder" | "task">(defaultType);
  const [dueDate, setDueDate] = useState("");
  const [priority, setPriority] = useState(0);
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const domainMeta = DOMAIN_MAP[domainKey] || DOMAINS[0];

  useEffect(() => {
    if (defaultType) {
      setItemType(defaultType);
    }
  }, [defaultType, open]);

  function handleFileSelection(incoming: FileList | null) {
    if (!incoming || incoming.length === 0) return;
    const fileList = Array.from(incoming);
    setAttachedFiles((prev) => [...prev, ...fileList]);
    if (!title && fileList[0]) {
      setTitle(fileList[0].name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " "));
    }
    // If files are attached, suggest Document type
    if (itemType === "note") {
      setItemType("document");
    }
  }

  function removeFile(index: number) {
    setAttachedFiles((prev) => prev.filter((_, i) => i !== index));
  }

  function resetForm() {
    setTitle("");
    setContent("");
    setDueDate("");
    setPriority(0);
    setAttachedFiles([]);
    setSaving(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Please enter a title for this item.");
      return;
    }

    setSaving(true);
    try {
      // 1. If files are attached, upload them first
      const uploadedAttachments: { name: string; url: string; size: number; type: string; documentId?: string }[] = [];

      for (let i = 0; i < attachedFiles.length; i++) {
        const file = attachedFiles[i];
        const formData = new FormData();
        formData.append("file", file);
        formData.append("title", file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " "));
        formData.append("description", `Attachment for ${title}`);
        formData.append("category", domainMeta.key);
        formData.append("documentType", "document");
        formData.append("createItem", "false");

        const uploadRes = await fetch("/api/documents/upload", {
          method: "POST",
          body: formData,
        });

        if (uploadRes.ok) {
          const data = await uploadRes.json();
          uploadedAttachments.push({
            name: file.name,
            url: data.document?.storagePath?.startsWith("local:")
              ? "/" + data.document.storagePath.replace(/^local:/, "").replace(/\\/g, "/")
              : `/api/documents/${data.document?.id}`,
            size: file.size,
            type: file.type,
            documentId: data.document?.id,
          });
        }
      }

      // 2. Create the Item
      const itemRes = await fetch("/api/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          content: content.trim() || null,
          type: itemType,
          domainId: domainId || null,
          priority,
          dueDate: dueDate ? new Date(dueDate).toISOString() : null,
          metadata: {
            attachments: uploadedAttachments,
          },
        }),
      });

      if (!itemRes.ok) {
        throw new Error("Failed to save item");
      }

      const itemData = await itemRes.json();

      // 3. If item is a reminder or has a due date, also create in Reminders
      if (dueDate && (itemType === "reminder" || itemType === "task")) {
        await fetch("/api/reminders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: title.trim(),
            description: content.trim() || `Reminder in ${domainMeta.short}`,
            category: domainMeta.key,
            type: itemType === "reminder" ? "custom" : "goal_due",
            remindAt: new Date(dueDate).toISOString(),
            dueDate: new Date(dueDate).toISOString(),
            itemId: itemData.id,
          }),
        }).catch(() => {});
      }

      toast.success(`Saved to ${domainMeta.short}!`);
      resetForm();
      onOpenChange(false);
      onSuccess?.();
    } catch (err: any) {
      toast.error(err.message || "Could not save item");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto rounded-3xl p-6 border-stone-200/80 dark:border-zinc-800 bg-card">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div
              className="flex h-11 w-11 items-center justify-center rounded-2xl text-2xl shadow-xs"
              style={{ background: domainMeta.bgSoft }}
            >
              {domainMeta.emoji}
            </div>
            <div>
              <DialogTitle className="text-xl font-bold tracking-tight text-foreground">
                Add to {domainMeta.short}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Create a note, document record, task, or reminder in {domainMeta.name}.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {/* Item Type Selector (Macaron pill badges) */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1.5">
              Type
            </label>
            <div className="flex flex-wrap gap-2">
              {[
                { type: "note", label: "Note", color: "bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100", active: "bg-emerald-600 text-white font-bold" },
                { type: "document", label: "Document", color: "bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100", active: "bg-blue-600 text-white font-bold" },
                { type: "reminder", label: "Reminder", color: "bg-amber-50 text-amber-600 border-amber-200 hover:bg-amber-100", active: "bg-amber-600 text-white font-bold" },
                { type: "task", label: "Task", color: "bg-purple-50 text-purple-600 border-purple-200 hover:bg-purple-100", active: "bg-purple-600 text-white font-bold" },
              ].map((t) => {
                const isSelected = itemType === t.type;
                return (
                  <button
                    key={t.type}
                    type="button"
                    onClick={() => setItemType(t.type as any)}
                    className={cn(
                      "px-3.5 py-1.5 rounded-full text-xs transition-all border font-medium cursor-pointer",
                      isSelected ? t.active : t.color
                    )}
                  >
                    {t.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground block mb-1">
              Title *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Blood Test Results, Manjari Sethi, Passport..."
              className="w-full rounded-2xl border border-border/80 bg-background px-3.5 py-2.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#FF4D6D]/40 font-semibold"
            />
          </div>

          {/* Content / Notes */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground block mb-1">
              Description / Notes
            </label>
            <textarea
              rows={3}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Enter details, observations, medical panel summaries, family relations, or notes..."
              className="w-full rounded-2xl border border-border/80 bg-background px-3.5 py-2.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#FF4D6D]/40 resize-none leading-relaxed"
            />
          </div>

          {/* Attachments Section */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-muted-foreground">
                Attachments ({attachedFiles.length})
              </label>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-xs text-[#FF4D6D] hover:underline font-semibold flex items-center gap-1"
              >
                <Icon name="Plus" className="h-3 w-3" />
                <span>Add Files</span>
              </button>
            </div>

            <input
              type="file"
              ref={fileInputRef}
              multiple
              onChange={(e) => handleFileSelection(e.target.files)}
              className="hidden"
              accept=".pdf,.png,.jpg,.jpeg,.webp,.doc,.docx,.txt"
            />

            {attachedFiles.length > 0 ? (
              <div className="space-y-1.5 max-h-28 overflow-y-auto">
                {attachedFiles.map((file, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between gap-2 p-2 rounded-xl border border-border/60 bg-muted/30 text-xs"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <Icon name="Paperclip" className="h-3.5 w-3.5 text-[#FF4D6D] flex-shrink-0" />
                      <span className="truncate font-medium text-foreground">{file.name}</span>
                      <span className="text-muted-foreground text-[10px]">
                        ({(file.size / (1024 * 1024)).toFixed(2)} MB)
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFile(idx)}
                      className="h-5 w-5 rounded-md hover:bg-rose-50 text-rose-500 flex items-center justify-center transition-colors"
                    >
                      <Icon name="X" className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="rounded-2xl border border-dashed border-border/80 bg-muted/20 p-3.5 text-center cursor-pointer hover:bg-muted/40 transition-colors"
              >
                <p className="text-xs text-muted-foreground flex items-center justify-center gap-1.5">
                  <Icon name="Paperclip" className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>Click to attach PDF reports, images, or documents</span>
                </p>
              </div>
            )}
          </div>

          {/* Due Date / Reminder Field */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground block mb-1">
              Due Date / Reminder (Optional)
            </label>
            <div className="flex gap-2">
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="flex-1 rounded-2xl border border-border/80 bg-background px-3.5 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-[#FF4D6D]/40"
              />
              {dueDate && (
                <button
                  type="button"
                  onClick={() => setDueDate("")}
                  className="text-xs text-muted-foreground hover:text-foreground px-2"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-border/60">
            <button
              type="button"
              disabled={saving}
              onClick={() => onOpenChange(false)}
              className="px-4 py-2.5 rounded-full text-xs font-semibold text-muted-foreground hover:bg-muted transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !title.trim()}
              className="px-6 py-2.5 rounded-full text-xs font-bold text-white bg-[#FF4D6D] hover:bg-[#FF3358] shadow-md transition-all disabled:opacity-50 flex items-center gap-2 cursor-pointer"
            >
              {saving ? (
                <>
                  <Icon name="Loader2" className="h-4 w-4 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Icon name="Check" className="h-4 w-4" />
                  <span>Save to {domainMeta.short}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
