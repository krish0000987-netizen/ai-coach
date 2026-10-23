"use client";

import { useState, useEffect, useRef } from "react";
import { useLifeOS } from "@/store/life-os";
import { DOMAINS, DOMAIN_MAP } from "@/lib/constants";
import { Icon } from "../icon";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

export function VaultView() {
  const { vaultFilterCategory, openVault, openCoach } = useLifeOS();
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>(vaultFilterCategory || "all");
  const [filterExpiring, setFilterExpiring] = useState(false);
  const [storageStats, setStorageStats] = useState({ count: 0, totalBytes: 0 });

  // Upload modal state
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadTitle, setUploadTitle] = useState("");
  const [uploadDesc, setUploadDesc] = useState("");
  const [uploadCat, setUploadCat] = useState("health_wellness");
  const [uploadType, setUploadType] = useState("medical_report");
  const [uploadIssueDate, setUploadIssueDate] = useState("");
  const [uploadExpiryDate, setUploadExpiryDate] = useState("");
  const [uploadTags, setUploadTags] = useState("");
  const [uploadNotes, setUploadNotes] = useState("");
  const [uploading, setUploading] = useState(false);

  // Preview modal state
  const [previewDoc, setPreviewDoc] = useState<any | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync category filter from store
  useEffect(() => {
    if (vaultFilterCategory) {
      setSelectedCategory(vaultFilterCategory);
    }
  }, [vaultFilterCategory]);

  // Fetch documents
  async function loadDocuments() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedCategory && selectedCategory !== "all") params.set("category", selectedCategory);
      if (searchQuery) params.set("q", searchQuery);
      if (filterExpiring) params.set("expiring", "true");

      const res = await fetch(`/api/documents?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setDocuments(data.documents || []);
        setStorageStats({
          count: data.count || 0,
          totalBytes: data.totalSizeBytes || 0,
        });
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load documents");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDocuments();
  }, [selectedCategory, searchQuery, filterExpiring]);

  // Handle file drop / select
  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files[0]) {
      const f = e.target.files[0];
      setUploadFile(f);
      if (!uploadTitle) {
        // Remove extension for default title
        const nameWithoutExt = f.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ");
        setUploadTitle(nameWithoutExt);
      }
    }
  }

  // Handle upload submit
  async function handleUploadSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!uploadFile) {
      toast.error("Please select a file to upload");
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", uploadFile);
      formData.append("title", uploadTitle || uploadFile.name);
      formData.append("description", uploadDesc);
      formData.append("category", uploadCat);
      formData.append("documentType", uploadType);
      if (uploadIssueDate) formData.append("issueDate", uploadIssueDate);
      if (uploadExpiryDate) formData.append("expiryDate", uploadExpiryDate);
      if (uploadTags) formData.append("tags", uploadTags);
      if (uploadNotes) formData.append("notes", uploadNotes);

      const res = await fetch("/api/documents/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Upload failed");
      }

      toast.success("Document securely uploaded and indexed!");
      setUploadOpen(false);
      resetUploadForm();
      loadDocuments();
    } catch (err: any) {
      toast.error(err.message || "Failed to upload document");
    } finally {
      setUploading(false);
    }
  }

  function resetUploadForm() {
    setUploadFile(null);
    setUploadTitle("");
    setUploadDesc("");
    setUploadIssueDate("");
    setUploadExpiryDate("");
    setUploadTags("");
    setUploadNotes("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  // Open preview
  async function openPreview(doc: any) {
    setPreviewDoc(doc);
    setPreviewLoading(true);
    setPreviewUrl(null);
    try {
      const res = await fetch(`/api/documents/${doc.id}`);
      if (res.ok) {
        const data = await res.json();
        setPreviewUrl(data.signedUrl);
      }
    } catch (err) {
      toast.error("Failed to generate preview URL");
    } finally {
      setPreviewLoading(false);
    }
  }

  // Delete document
  async function handleDelete(docId: string, docTitle: string) {
    if (!confirm(`Are you sure you want to delete "${docTitle}" from your vault?`)) {
      return;
    }
    try {
      const res = await fetch(`/api/documents/${docId}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Document deleted");
        if (previewDoc?.id === docId) setPreviewDoc(null);
        loadDocuments();
      } else {
        toast.error("Failed to delete document");
      }
    } catch {
      toast.error("Error deleting document");
    }
  }

  const formatSize = (bytes: number) => {
    if (!bytes) return "0 KB";
    const k = 1024;
    if (bytes < k * k) return (bytes / k).toFixed(1) + " KB";
    return (bytes / (k * k)).toFixed(2) + " MB";
  };

  const currentCategoryDocTypes = DOMAIN_MAP[uploadCat]?.documentTypes || [];

  return (
    <div className="space-y-6">
      {/* Header & Stats */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-sm">
              <Icon name="ShieldCheck" className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Personal Document Vault</h1>
              <p className="text-sm text-muted-foreground">
                Private Supabase Storage with client-side isolation, text extraction, and predictive expiry alerts.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden rounded-lg border border-border/60 bg-muted/30 px-3 py-1.5 text-xs text-muted-foreground md:block">
            <span className="font-semibold text-foreground">{storageStats.count}</span> records ·{" "}
            <span className="font-semibold text-foreground">{formatSize(storageStats.totalBytes)}</span> used
          </div>
          <button
            onClick={() => setUploadOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:opacity-95"
          >
            <Icon name="Upload" className="h-4 w-4" />
            Upload Document
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/60 bg-card/60 p-3 shadow-sm backdrop-blur-sm">
        {/* Search */}
        <div className="relative min-w-[240px] flex-1">
          <Icon name="Search" className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search documents, text contents, or tags…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-border/60 bg-background/80 py-2 pl-9 pr-4 text-sm outline-none transition-colors focus:border-indigo-500"
          />
        </div>

        {/* Category Pill selector */}
        <div className="flex items-center gap-2 overflow-x-auto py-1">
          <button
            onClick={() => {
              setSelectedCategory("all");
              openVault(null);
            }}
            className={cn(
              "rounded-lg px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap",
              selectedCategory === "all"
                ? "bg-foreground text-background"
                : "bg-muted/50 text-muted-foreground hover:bg-muted"
            )}
          >
            All Categories ({storageStats.count})
          </button>
          {DOMAINS.map((d) => (
            <button
              key={d.key}
              onClick={() => {
                setSelectedCategory(d.key);
                openVault(d.key);
              }}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap",
                selectedCategory === d.key
                  ? "bg-indigo-600 text-white"
                  : "bg-muted/50 text-muted-foreground hover:bg-muted"
              )}
            >
              <Icon name={d.icon} className="h-3 w-3" />
              {d.short}
            </button>
          ))}
        </div>

        {/* Expiring toggle */}
        <button
          onClick={() => setFilterExpiring(!filterExpiring)}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-medium transition-colors",
            filterExpiring
              ? "border-amber-500 bg-amber-500/10 text-amber-600"
              : "border-border/60 text-muted-foreground hover:bg-muted/50"
          )}
        >
          <Icon name="AlertTriangle" className="h-3.5 w-3.5" />
          Expiring Soon
        </button>
      </div>

      {/* Document Grid / List */}
      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-44 animate-pulse rounded-2xl border border-border/40 bg-muted/30" />
          ))}
        </div>
      ) : documents.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/80 bg-card/30 p-12 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-500">
            <Icon name="FolderPlus" className="h-7 w-7" />
          </div>
          <h3 className="mt-4 text-base font-semibold">No documents found</h3>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            {searchQuery || selectedCategory !== "all"
              ? "No documents match your active filters. Try clearing search or category."
              : "Your vault is empty. Securely upload passports, medical reports, insurance policies, and deeds."}
          </p>
          <button
            onClick={() => setUploadOpen(true)}
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700"
          >
            <Icon name="Upload" className="h-4 w-4" />
            Upload First Document
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {documents.map((doc) => {
            const domain = DOMAIN_MAP[doc.category] || DOMAIN_MAP.legal_government;
            const now = new Date();
            const expDate = doc.expiryDate ? new Date(doc.expiryDate) : null;
            const isExpired = expDate ? expDate < now : false;
            const daysLeft = expDate ? Math.ceil((expDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : null;

            return (
              <motion.div
                key={doc.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="group relative flex flex-col justify-between rounded-2xl border border-border/60 bg-card p-5 shadow-xs transition-all hover:border-indigo-500/40 hover:shadow-md"
              >
                <div>
                  {/* Top category & expiry tags */}
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
                      style={{ background: `${domain?.color}15`, color: domain?.color }}
                    >
                      <Icon name={domain?.icon || "FileText"} className="h-3 w-3" />
                      {domain?.short || doc.category}
                    </span>

                    {daysLeft !== null && (
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-[10px] font-bold",
                          isExpired
                            ? "bg-rose-500/15 text-rose-600"
                            : daysLeft <= 30
                            ? "bg-amber-500/15 text-amber-600"
                            : "bg-emerald-500/15 text-emerald-600"
                        )}
                      >
                        {isExpired ? "Expired" : `${daysLeft}d left`}
                      </span>
                    )}
                  </div>

                  {/* Title & Type */}
                  <h3 className="mt-3 font-semibold tracking-tight text-foreground line-clamp-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                    {doc.title}
                  </h3>
                  <div className="mt-0.5 text-xs text-muted-foreground capitalize">
                    {doc.documentType.replace(/_/g, " ")} · {formatSize(doc.fileSize)}
                  </div>

                  {doc.description && (
                    <p className="mt-2 text-xs text-muted-foreground/90 line-clamp-2">
                      {doc.description}
                    </p>
                  )}

                  {/* Extracted text indicator */}
                  {doc.extractedText && (
                    <div className="mt-3 flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400">
                      <Icon name="CheckCircle2" className="h-3 w-3" />
                      <span>Text extracted & searchable</span>
                    </div>
                  )}
                </div>

                {/* Bottom actions */}
                <div className="mt-4 flex items-center justify-between border-t border-border/40 pt-3">
                  <div className="text-[11px] text-muted-foreground">
                    {doc.issueDate ? `Issued: ${new Date(doc.issueDate).toLocaleDateString()}` : `Uploaded: ${new Date(doc.createdAt).toLocaleDateString()}`}
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => openPreview(doc)}
                      className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                      title="Preview Document"
                    >
                      <Icon name="Eye" className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => openCoach(domain?.coachType || "unified")}
                      className="rounded-lg p-1.5 text-indigo-600 transition-colors hover:bg-indigo-50 dark:hover:bg-indigo-950/40"
                      title="Ask AI Coach about this"
                    >
                      <Icon name="Sparkles" className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(doc.id, doc.title)}
                      className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40"
                      title="Delete"
                    >
                      <Icon name="Trash2" className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Upload Modal */}
      <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Icon name="Upload" className="h-5 w-5 text-indigo-600" />
              Secure Document Upload
            </DialogTitle>
            <DialogDescription>
              Upload confidential personal documents to your private vault. Files are protected with strict authorization.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleUploadSubmit} className="space-y-4">
            {/* File drop zone */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className={cn(
                "flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-6 text-center transition-colors",
                uploadFile
                  ? "border-indigo-500 bg-indigo-500/5"
                  : "border-border hover:border-indigo-500/50 hover:bg-muted/30"
              )}
            >
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept=".pdf,.png,.jpg,.jpeg,.webp,.txt,.doc,.docx"
                onChange={onFileChange}
              />
              <Icon name="FileUp" className="h-8 w-8 text-indigo-500" />
              {uploadFile ? (
                <div className="mt-2">
                  <div className="font-semibold text-foreground">{uploadFile.name}</div>
                  <div className="text-xs text-muted-foreground">{formatSize(uploadFile.size)}</div>
                </div>
              ) : (
                <div className="mt-2">
                  <span className="text-sm font-semibold text-indigo-600">Click to upload</span> or drag and drop
                  <div className="text-xs text-muted-foreground">PDF, JPEG, PNG, DOCX, TXT (up to 50MB)</div>
                </div>
              )}
            </div>

            {/* Document Title */}
            <div>
              <label className="text-xs font-semibold text-muted-foreground">Document Title</label>
              <input
                type="text"
                required
                placeholder="e.g. US Passport or 2025 Bloodwork Report"
                value={uploadTitle}
                onChange={(e) => setUploadTitle(e.target.value)}
                className="mt-1 w-full rounded-xl border border-border/80 bg-background px-3 py-2 text-sm outline-none focus:border-indigo-500"
              />
            </div>

            {/* Category and Document Type */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="text-xs font-semibold text-muted-foreground">Life Category</label>
                <select
                  value={uploadCat}
                  onChange={(e) => {
                    setUploadCat(e.target.value);
                    const types = DOMAIN_MAP[e.target.value]?.documentTypes;
                    if (types && types[0]) setUploadType(types[0].key);
                  }}
                  className="mt-1 w-full rounded-xl border border-border/80 bg-background px-3 py-2 text-sm outline-none focus:border-indigo-500"
                >
                  {DOMAINS.map((d) => (
                    <option key={d.key} value={d.key}>
                      {d.categoryNumber}. {d.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground">Document Type</label>
                <select
                  value={uploadType}
                  onChange={(e) => setUploadType(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-border/80 bg-background px-3 py-2 text-sm outline-none focus:border-indigo-500"
                >
                  {currentCategoryDocTypes.map((t) => (
                    <option key={t.key} value={t.key}>
                      {t.label}
                    </option>
                  ))}
                  <option value="other">Other Record</option>
                </select>
              </div>
            </div>

            {/* Dates: Issue Date & Expiry Date */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="text-xs font-semibold text-muted-foreground">Issue Date (Optional)</label>
                <input
                  type="date"
                  value={uploadIssueDate}
                  onChange={(e) => setUploadIssueDate(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-border/80 bg-background px-3 py-2 text-sm outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground">
                  Expiry / Renewal Date (Triggers Alerts)
                </label>
                <input
                  type="date"
                  value={uploadExpiryDate}
                  onChange={(e) => setUploadExpiryDate(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-border/80 bg-background px-3 py-2 text-sm outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            {/* Description / Notes */}
            <div>
              <label className="text-xs font-semibold text-muted-foreground">Notes & Key Details</label>
              <textarea
                rows={2}
                placeholder="Doctor's name, policy number, or renewal guidelines…"
                value={uploadDesc}
                onChange={(e) => setUploadDesc(e.target.value)}
                className="mt-1 w-full rounded-xl border border-border/80 bg-background px-3 py-2 text-sm outline-none focus:border-indigo-500"
              />
            </div>

            {/* Tags */}
            <div>
              <label className="text-xs font-semibold text-muted-foreground">Tags (Comma-separated)</label>
              <input
                type="text"
                placeholder="medical, annual, dr-vance"
                value={uploadTags}
                onChange={(e) => setUploadTags(e.target.value)}
                className="mt-1 w-full rounded-xl border border-border/80 bg-background px-3 py-2 text-sm outline-none focus:border-indigo-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setUploadOpen(false)}
                className="rounded-xl border border-border/80 px-4 py-2 text-sm font-semibold hover:bg-muted"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={uploading || !uploadFile}
                className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50"
              >
                {uploading ? (
                  <>
                    <Icon name="Loader2" className="h-4 w-4 animate-spin" />
                    Uploading & Indexing…
                  </>
                ) : (
                  <>
                    <Icon name="Upload" className="h-4 w-4" />
                    Save to Vault
                  </>
                )}
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Document Detail & Preview Modal */}
      <Dialog open={!!previewDoc} onOpenChange={(open) => !open && setPreviewDoc(null)}>
        <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-2xl">
          {previewDoc && (
            <div className="space-y-4">
              <DialogHeader>
                <div className="flex items-center justify-between gap-2">
                  <span
                    className="rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize"
                    style={{
                      background: `${DOMAIN_MAP[previewDoc.category]?.color}20`,
                      color: DOMAIN_MAP[previewDoc.category]?.color,
                    }}
                  >
                    {DOMAIN_MAP[previewDoc.category]?.name || previewDoc.category}
                  </span>
                  <div className="text-xs text-muted-foreground">
                    {formatSize(previewDoc.fileSize)} · {previewDoc.fileName}
                  </div>
                </div>
                <DialogTitle className="mt-2 text-xl font-bold">{previewDoc.title}</DialogTitle>
                {previewDoc.description && (
                  <DialogDescription>{previewDoc.description}</DialogDescription>
                )}
              </DialogHeader>

              {/* Secure Download / View Button */}
              <div className="flex flex-wrap items-center gap-2 border-y border-border/40 py-3">
                {previewLoading ? (
                  <div className="inline-flex items-center gap-2 text-xs text-muted-foreground">
                    <Icon name="Loader2" className="h-4 w-4 animate-spin text-indigo-500" />
                    Generating secure signed access URL…
                  </div>
                ) : previewUrl ? (
                  <>
                    <a
                      href={previewUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-700"
                    >
                      <Icon name="ExternalLink" className="h-3.5 w-3.5" />
                      Open Full Document
                    </a>
                    <a
                      href={previewUrl}
                      download={previewDoc.fileName}
                      className="inline-flex items-center gap-2 rounded-xl border border-border px-3 py-2 text-xs font-semibold hover:bg-muted"
                    >
                      <Icon name="Download" className="h-3.5 w-3.5" />
                      Download
                    </a>
                  </>
                ) : (
                  <div className="text-xs text-rose-500">
                    Failed to generate signed URL. File may be in local demo mode.
                  </div>
                )}

                <button
                  onClick={() => {
                    const dom = DOMAIN_MAP[previewDoc.category];
                    setPreviewDoc(null);
                    openCoach(dom?.coachType || "unified");
                  }}
                  className="ml-auto inline-flex items-center gap-1.5 rounded-xl bg-purple-500/10 px-3 py-2 text-xs font-semibold text-purple-600 hover:bg-purple-500/20"
                >
                  <Icon name="Sparkles" className="h-3.5 w-3.5" />
                  Analyze with AI Coach
                </button>
              </div>

              {/* Document Metadata Grid */}
              <div className="grid grid-cols-2 gap-3 rounded-xl border border-border/60 bg-muted/20 p-3 text-xs sm:grid-cols-3">
                <div>
                  <div className="font-semibold text-muted-foreground">Document Type</div>
                  <div className="mt-0.5 capitalize text-foreground">{previewDoc.documentType.replace(/_/g, " ")}</div>
                </div>
                <div>
                  <div className="font-semibold text-muted-foreground">Issue Date</div>
                  <div className="mt-0.5 text-foreground">
                    {previewDoc.issueDate ? new Date(previewDoc.issueDate).toLocaleDateString() : "—"}
                  </div>
                </div>
                <div>
                  <div className="font-semibold text-muted-foreground">Expiry Date</div>
                  <div className="mt-0.5 font-medium text-foreground">
                    {previewDoc.expiryDate ? new Date(previewDoc.expiryDate).toLocaleDateString() : "No expiry"}
                  </div>
                </div>
              </div>

              {/* Extracted Text Content */}
              {previewDoc.extractedText && (
                <div>
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                    <Icon name="FileSearch" className="h-3.5 w-3.5 text-indigo-500" />
                    Indexed Text (Extracted by Vault Pipeline)
                  </div>
                  <div className="mt-2 max-h-48 overflow-y-auto rounded-xl border border-border/60 bg-muted/40 p-3 font-mono text-xs text-muted-foreground">
                    {previewDoc.extractedText}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
