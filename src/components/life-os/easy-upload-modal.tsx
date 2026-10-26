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

interface EasyUploadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultCategory?: string;
  onSuccess?: () => void;
}

export function EasyUploadModal({
  open,
  onOpenChange,
  defaultCategory = "health_wellness",
  onSuccess,
}: EasyUploadModalProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [selectedCategory, setSelectedCategory] = useState(defaultCategory);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (defaultCategory) {
      setSelectedCategory(defaultCategory);
    }
  }, [defaultCategory, open]);

  function handleFileSelection(incomingFiles: FileList | null) {
    if (!incomingFiles || incomingFiles.length === 0) return;
    const fileList = Array.from(incomingFiles);
    setFiles((prev) => [...prev, ...fileList]);

    if (!title && fileList[0]) {
      const cleanTitle = fileList[0].name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ");
      setTitle(cleanTitle);
    }
  }

  function removeFile(index: number) {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  }

  function resetForm() {
    setFiles([]);
    setTitle("");
    setDescription("");
    setExpiryDate("");
    setUploading(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (files.length === 0) {
      toast.error("Please choose or drop at least one file to upload.");
      return;
    }

    setUploading(true);
    let successCount = 0;

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const formData = new FormData();
        formData.append("file", file);
        formData.append(
          "title",
          files.length === 1 && title ? title : file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ")
        );
        formData.append("description", description);
        formData.append("category", selectedCategory);
        formData.append("documentType", "document");
        formData.append("createItem", "true");
        if (expiryDate) {
          formData.append("expiryDate", expiryDate);
        }

        const res = await fetch("/api/documents/upload", {
          method: "POST",
          body: formData,
        });

        if (res.ok) {
          successCount++;
        }
      }

      if (successCount > 0) {
        toast.success(`Successfully uploaded ${successCount} file${successCount > 1 ? "s" : ""} to ${DOMAIN_MAP[selectedCategory]?.short || "Vault"}!`);
        resetForm();
        onOpenChange(false);
        onSuccess?.();
      } else {
        toast.error("Upload failed. Please check file format and size.");
      }
    } catch {
      toast.error("Network or storage error occurred while uploading.");
    } finally {
      setUploading(false);
    }
  }

  const currentCatMeta = DOMAIN_MAP[selectedCategory] || DOMAINS[0];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto rounded-3xl p-6 border-stone-200/80 dark:border-zinc-800 bg-card">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div
              className="flex h-11 w-11 items-center justify-center rounded-2xl text-2xl shadow-xs"
              style={{ background: currentCatMeta.bgSoft }}
            >
              {currentCatMeta.emoji}
            </div>
            <div>
              <DialogTitle className="text-xl font-bold tracking-tight text-foreground">
                Upload to {currentCatMeta.short}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Drop reports, IDs, bills, or certificates. Saved securely with auto-text extraction.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {/* Category Picker */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1.5">
              Select Category
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-36 overflow-y-auto p-1 border border-border/60 rounded-2xl bg-muted/20">
              {DOMAINS.map((dom) => {
                const isSelected = selectedCategory === dom.key;
                return (
                  <button
                    key={dom.key}
                    type="button"
                    onClick={() => setSelectedCategory(dom.key)}
                    className={cn(
                      "flex items-center gap-2 p-2 rounded-xl text-left text-xs transition-all border",
                      isSelected
                        ? "border-[#FF4D6D] bg-[#FF4D6D]/10 font-bold shadow-xs text-foreground"
                        : "border-transparent hover:bg-muted/60 text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <span
                      className="flex h-6 w-6 items-center justify-center rounded-lg text-sm flex-shrink-0"
                      style={{ background: dom.bgSoft }}
                    >
                      {dom.emoji}
                    </span>
                    <span className="truncate">{dom.short}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Drag & Drop Upload Zone */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragOver(true);
            }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragOver(false);
              handleFileSelection(e.dataTransfer.files);
            }}
            onClick={() => fileInputRef.current?.click()}
            className={cn(
              "relative flex flex-col items-center justify-center rounded-3xl border-2 border-dashed p-6 text-center cursor-pointer transition-all",
              isDragOver
                ? "border-[#FF4D6D] bg-[#FF4D6D]/10 scale-[1.01]"
                : "border-stone-200 dark:border-zinc-800 bg-muted/20 hover:border-stone-300 hover:bg-muted/40"
            )}
          >
            <input
              type="file"
              ref={fileInputRef}
              multiple
              onChange={(e) => handleFileSelection(e.target.files)}
              className="hidden"
              accept=".pdf,.png,.jpg,.jpeg,.webp,.doc,.docx,.txt"
            />
            <div
              className="flex h-12 w-12 items-center justify-center rounded-2xl text-2xl mb-2.5 shadow-xs"
              style={{ background: currentCatMeta.bgSoft }}
            >
              📎
            </div>
            <p className="text-sm font-bold text-foreground">
              {files.length > 0 ? "Add more files or drop here" : "Click to select or drop files here"}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Supports PDF, PNG, JPG, Word documents, lab reports, receipts (up to 50MB)
            </p>
          </div>

          {/* Attached Files List */}
          {files.length > 0 && (
            <div className="space-y-1.5 max-h-32 overflow-y-auto">
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Selected Files ({files.length})
              </span>
              {files.map((f, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between gap-2 p-2.5 rounded-xl border border-border/60 bg-card text-xs shadow-2xs"
                >
                  <div className="flex items-center gap-2 truncate">
                    <Icon name="Paperclip" className="h-4 w-4 text-[#FF4D6D] flex-shrink-0" />
                    <span className="font-semibold truncate text-foreground">{f.name}</span>
                    <span className="text-muted-foreground text-[10px]">
                      ({(f.size / (1024 * 1024)).toFixed(2)} MB)
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFile(idx);
                    }}
                    className="h-6 w-6 rounded-lg hover:bg-rose-50 text-rose-500 flex items-center justify-center transition-colors"
                  >
                    <Icon name="X" className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Title & Notes */}
          <div className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1">
                Record Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Blood Test Results, Passport Copy, Property Deed..."
                className="w-full rounded-2xl border border-border/80 bg-background px-3.5 py-2.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#FF4D6D]/40"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1">
                Description / Notes
              </label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add details, findings, renewal instructions..."
                className="w-full rounded-2xl border border-border/80 bg-background px-3.5 py-2.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#FF4D6D]/40 resize-none"
              />
            </div>

            {/* Optional Expiry / Reminder Date */}
            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1">
                Expiration / Renewal Date (Optional)
              </label>
              <div className="flex gap-2">
                <input
                  type="date"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                  className="flex-1 rounded-2xl border border-border/80 bg-background px-3.5 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-[#FF4D6D]/40"
                />
                {expiryDate && (
                  <button
                    type="button"
                    onClick={() => setExpiryDate("")}
                    className="text-xs text-muted-foreground hover:text-foreground px-2"
                  >
                    Clear
                  </button>
                )}
              </div>
              <p className="text-[10px] text-muted-foreground mt-1">
                Setting an expiry date automatically schedules proactive alerts 30 & 7 days prior.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/60">
            <button
              type="button"
              disabled={uploading}
              onClick={() => onOpenChange(false)}
              className="px-4 py-2.5 rounded-full text-xs font-semibold text-muted-foreground hover:bg-muted transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={uploading || files.length === 0}
              className="px-6 py-2.5 rounded-full text-xs font-bold text-white bg-[#FF4D6D] hover:bg-[#FF3358] shadow-md transition-all disabled:opacity-50 flex items-center gap-2 cursor-pointer"
            >
              {uploading ? (
                <>
                  <Icon name="Loader2" className="h-4 w-4 animate-spin" />
                  <span>Uploading {files.length} file{files.length > 1 ? "s" : ""}...</span>
                </>
              ) : (
                <>
                  <Icon name="Upload" className="h-4 w-4" />
                  <span>Upload & Save Record</span>
                </>
              )}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
