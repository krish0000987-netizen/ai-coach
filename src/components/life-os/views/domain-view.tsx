"use client";

import { useState, useEffect, useRef } from "react";
import { useLifeOS } from "@/store/life-os";
import { DOMAINS, DOMAIN_MAP, AI_COACH_MAP } from "@/lib/constants";
import { Icon } from "../icon";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { AddItemModal } from "../add-item-modal";
import { EasyUploadModal } from "../easy-upload-modal";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function DomainView({ domainKey }: { domainKey: string }) {
  const { setView, openCoach, openItemDetail, openItemEditor } = useLifeOS();
  const domainMeta = DOMAIN_MAP[domainKey] || DOMAINS[0];

  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isDragOver, setIsDragOver] = useState(false);

  // Modals
  const [addItemOpen, setAddItemOpen] = useState(false);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [defaultAddType, setDefaultAddType] = useState<"document" | "note" | "reminder" | "task">("note");

  // Coach prompt
  const [quickCoachQuery, setQuickCoachQuery] = useState("");

  // Domain Record (database domain id)
  const [domainId, setDomainId] = useState<string | undefined>(undefined);

  // Load items for this domain
  async function loadItems() {
    setLoading(true);
    try {
      // 1. Fetch domain record
      const domRes = await fetch("/api/domains");
      const domData = domRes.ok ? await domRes.json() : { domains: [] };
      const dRec = (domData.domains || []).find(
        (d: any) => d.key === domainMeta.key || d.key === domainKey
      );
      if (dRec) setDomainId(dRec.id);

      // 2. Fetch items for this domain
      const searchP = new URLSearchParams();
      if (dRec?.id) {
        searchP.set("domain", dRec.id);
      } else {
        searchP.set("domain", domainMeta.key);
      }
      searchP.set("status", "active,done");

      const res = await fetch(`/api/items?${searchP.toString()}`);
      if (res.ok) {
        const json = await res.json();
        setItems(json.items || []);
      }
    } catch {
      toast.error("Failed to load category records");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadItems();
  }, [domainMeta.key, domainKey]);

  // Handle direct file upload via drag-drop on the page
  async function handlePageDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragOver(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length === 0) return;

    toast.info(`Uploading ${files.length} file${files.length > 1 ? "s" : ""} to ${domainMeta.short}...`);

    let uploaded = 0;
    for (const file of files) {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("title", file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " "));
      formData.append("category", domainMeta.key);
      formData.append("createItem", "true");

      try {
        const res = await fetch("/api/documents/upload", {
          method: "POST",
          body: formData,
        });
        if (res.ok) uploaded++;
      } catch {
        // ignore
      }
    }

    if (uploaded > 0) {
      toast.success(`Successfully uploaded ${uploaded} file${uploaded > 1 ? "s" : ""} to ${domainMeta.short}!`);
      loadItems();
    }
  }

  // Delete item
  async function handleDeleteItem(itemId: string, title: string) {
    if (!confirm(`Are you sure you want to delete "${title}"?`)) return;

    try {
      const res = await fetch(`/api/items/${itemId}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Item removed");
        setItems((prev) => prev.filter((i) => i.id !== itemId));
      } else {
        toast.error("Could not delete item");
      }
    } catch {
      toast.error("Failed to delete item");
    }
  }

  // Coach metadata
  const coachType = domainMeta.coachType || domainMeta.key;
  const coach = AI_COACH_MAP[coachType] || AI_COACH_MAP.unified;

  // Filter items
  const filteredItems = items.filter((item) => {
    if (filterType !== "all" && item.type !== filterType) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = item.title?.toLowerCase().includes(q);
      const matchContent = item.content?.toLowerCase().includes(q);
      return matchTitle || matchContent;
    }
    return true;
  });

  const docCount = items.filter((i) => i.type === "document").length;
  const noteCount = items.filter((i) => i.type === "note").length;
  const taskCount = items.filter((i) => i.type === "task").length;
  const reminderCount = items.filter((i) => i.type === "reminder").length;

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragOver(true);
      }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={handlePageDrop}
      className="space-y-6 pb-28 max-w-4xl mx-auto px-2 sm:px-4"
    >
      {/* Top Banner Header — matching Image 3 "Life Book" */}
      <div className="relative overflow-hidden rounded-3xl border border-stone-200/70 dark:border-zinc-800 bg-gradient-to-r from-rose-100/60 via-pink-100/40 to-amber-100/30 dark:from-zinc-900 dark:via-zinc-900/90 dark:to-zinc-800 p-6 sm:p-7 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#FF4D6D] text-white text-[10px] font-bold">
                ✓
              </span>
              <p className="text-xs font-bold uppercase tracking-wider text-[#FF4D6D]">
                Life Book
              </p>
            </div>
            <h1 className="mt-1 text-2xl sm:text-3xl font-extrabold tracking-tight text-stone-900 dark:text-stone-100">
              {domainMeta.name}
            </h1>
            <p className="mt-1 text-xs text-stone-600 dark:text-stone-400">
              Shared by You · Local & encrypted personal records
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => openCoach(coachType)}
              className="inline-flex items-center gap-1.5 rounded-full border border-stone-200 dark:border-zinc-700 bg-white/90 dark:bg-zinc-800 px-4 py-2 text-xs font-bold text-stone-700 dark:text-stone-200 hover:bg-white shadow-xs cursor-pointer transition-colors"
            >
              <Icon name="Sparkles" className="h-3.5 w-3.5 text-indigo-500" />
              <span>Ask {domainMeta.short} Coach</span>
            </button>
          </div>
        </div>
      </div>

      {/* Category Sub-header with Back Button, Category Icon, Title, and Add Item Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
        <div className="flex items-center gap-3.5">
          {/* Back Button */}
          <button
            onClick={() => setView("dashboard")}
            className="flex h-11 w-11 items-center justify-center rounded-2xl border border-stone-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-stone-700 dark:text-stone-200 hover:bg-stone-50 shadow-xs transition-transform active:scale-95 cursor-pointer"
            aria-label="Back to Categories"
          >
            <Icon name="ArrowLeft" className="h-5 w-5" />
          </button>

          {/* Category Icon */}
          <div
            className="flex h-12 w-12 items-center justify-center rounded-2xl text-2xl shadow-xs"
            style={{ background: domainMeta.bgSoft }}
          >
            {domainMeta.emoji}
          </div>

          {/* Title & Count */}
          <div>
            <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-stone-900 dark:text-stone-100">
              {domainMeta.short}
            </h2>
            <p className="text-xs font-semibold text-stone-500 dark:text-stone-400">
              {items.length} {items.length === 1 ? "item" : "items"}
            </p>
          </div>
        </div>

        {/* Big Vibrant Coral-Red Action Button: + Add Item */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setDefaultAddType("note");
              setAddItemOpen(true);
            }}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 rounded-full bg-[#FF4D6D] hover:bg-[#FF3358] px-7 py-3 text-sm font-extrabold text-white shadow-md shadow-rose-500/25 transition-all hover:scale-105 active:scale-95 cursor-pointer"
          >
            <Icon name="Plus" className="h-4 w-4" strokeWidth={3} />
            <span>+ Add Item</span>
          </button>

          <button
            onClick={() => setUploadModalOpen(true)}
            className="inline-flex items-center justify-center gap-1.5 rounded-full border border-stone-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-4 py-3 text-xs font-bold text-stone-700 dark:text-stone-200 hover:bg-stone-50 shadow-xs cursor-pointer transition-colors"
            title="Upload Document"
          >
            <Icon name="Upload" className="h-4 w-4" />
            <span className="hidden sm:inline">Upload</span>
          </button>
        </div>
      </div>

      {/* Easy Drag & Drop File Upload Strip */}
      <div
        onClick={() => setUploadModalOpen(true)}
        className={cn(
          "rounded-3xl border-2 border-dashed p-4 text-center cursor-pointer transition-all flex items-center justify-center gap-2 text-xs",
          isDragOver
            ? "border-[#FF4D6D] bg-[#FF4D6D]/15 scale-[1.01]"
            : "border-stone-200/90 dark:border-zinc-800 bg-white/60 dark:bg-zinc-900/40 hover:border-stone-300 hover:bg-white text-stone-600 dark:text-stone-300 shadow-2xs"
        )}
      >
        <span className="text-base">📎</span>
        <span className="font-semibold">
          {isDragOver
            ? `Drop files to upload directly to ${domainMeta.short}!`
            : `Drag & drop blood reports, bills, IDs, or prescriptions here to upload instantly`}
        </span>
        <span className="text-[#FF4D6D] font-bold underline ml-1">Browse</span>
      </div>

      {/* Quick Filter Pills (All, Documents, Notes, Reminders, Tasks) */}
      <div className="flex flex-wrap items-center gap-2">
        {[
          { key: "all", label: `All (${items.length})` },
          { key: "document", label: `Documents (${docCount})` },
          { key: "note", label: `Notes (${noteCount})` },
          { key: "reminder", label: `Reminders (${reminderCount})` },
          { key: "task", label: `Tasks (${taskCount})` },
        ].map((tab) => {
          const isActive = filterType === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setFilterType(tab.key)}
              className={cn(
                "px-3.5 py-1.5 rounded-full text-xs font-bold transition-all border cursor-pointer",
                isActive
                  ? "bg-stone-900 text-white dark:bg-white dark:text-stone-900 border-transparent shadow-xs"
                  : "bg-white dark:bg-zinc-900 border-stone-200/80 dark:border-zinc-800 text-stone-600 dark:text-stone-400 hover:bg-stone-100"
              )}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Item Cards List — Exact replica of uploaded screenshots (Image 3, 4, 5) */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 rounded-3xl bg-stone-100 dark:bg-zinc-800 animate-pulse" />
          ))}
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-stone-200 dark:border-zinc-800 bg-white/60 dark:bg-zinc-900/40 p-10 text-center space-y-3">
          <div
            className="flex h-14 w-14 items-center justify-center rounded-2xl text-3xl mx-auto shadow-xs"
            style={{ background: domainMeta.bgSoft }}
          >
            {domainMeta.emoji}
          </div>
          <h3 className="text-base font-bold text-stone-900 dark:text-stone-100">
            No items in {domainMeta.short} yet
          </h3>
          <p className="text-xs text-stone-500 max-w-sm mx-auto">
            Click "+ Add Item" or drop your first medical panel, report, family note, or reminder above.
          </p>
          <div className="flex justify-center gap-2 pt-2">
            <button
              onClick={() => {
                setDefaultAddType("note");
                setAddItemOpen(true);
              }}
              className="px-5 py-2.5 rounded-full bg-[#FF4D6D] text-white text-xs font-bold shadow-xs hover:bg-[#FF3358] cursor-pointer"
            >
              + Add First Item
            </button>
            <button
              onClick={() => setUploadModalOpen(true)}
              className="px-5 py-2.5 rounded-full border border-stone-200 bg-white text-stone-700 text-xs font-semibold hover:bg-stone-50 cursor-pointer"
            >
              Upload Document
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3.5">
          {filteredItems.map((item) => {
            const attachments = item.metadata?.attachments || [];
            const isDone = item.status === "done";

            // Determine badge style
            const typeConfig: Record<string, { label: string; badgeClass: string }> = {
              document: {
                label: "Document",
                badgeClass: "bg-blue-50 text-blue-600 border border-blue-200 dark:bg-blue-950/50 dark:text-blue-400 dark:border-blue-800",
              },
              note: {
                label: "Note",
                badgeClass: "bg-emerald-50 text-emerald-600 border border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-400 dark:border-emerald-800",
              },
              reminder: {
                label: "Reminder",
                badgeClass: "bg-amber-50 text-amber-600 border border-amber-200 dark:bg-amber-950/50 dark:text-amber-400 dark:border-amber-800",
              },
              task: {
                label: "Task",
                badgeClass: "bg-purple-50 text-purple-600 border border-purple-200 dark:bg-purple-950/50 dark:text-purple-400 dark:border-purple-800",
              },
              milestone: {
                label: "Milestone",
                badgeClass: "bg-rose-50 text-rose-600 border border-rose-200 dark:bg-rose-950/50 dark:text-rose-400 dark:border-rose-800",
              },
            };

            const config = typeConfig[item.type] || {
              label: item.type.charAt(0).toUpperCase() + item.type.slice(1),
              badgeClass: "bg-stone-100 text-stone-600 border border-stone-200",
            };

            return (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn(
                  "rounded-3xl border border-stone-200/70 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 shadow-[0_2px_12px_rgba(0,0,0,0.02)] hover:shadow-md transition-all",
                  isDone && "opacity-75"
                )}
              >
                {/* Header Row: Title + Type Badge + Edit & Delete Buttons */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2 min-w-0">
                    <h3 className="text-base sm:text-lg font-bold text-stone-900 dark:text-stone-100 tracking-tight">
                      {item.title}
                    </h3>
                    <span className={cn("px-2.5 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap", config.badgeClass)}>
                      {config.label}
                    </span>
                  </div>

                  {/* Top Right Action Buttons: Pencil (Edit) & Trash (Delete) */}
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button
                      onClick={() => openItemEditor({ id: item.id, ...item })}
                      className="flex h-8 w-8 items-center justify-center rounded-xl bg-stone-100/80 dark:bg-zinc-800 text-stone-600 dark:text-stone-300 hover:bg-stone-200 hover:text-stone-900 transition-colors cursor-pointer"
                      title="Edit Item"
                    >
                      <Icon name="Pencil" className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteItem(item.id, item.title)}
                      className="flex h-8 w-8 items-center justify-center rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-500 hover:bg-rose-100 dark:hover:bg-rose-900/50 transition-colors cursor-pointer"
                      title="Delete Item"
                    >
                      <Icon name="Trash2" className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Description Body */}
                {item.content && (
                  <p className="mt-2 text-sm leading-relaxed text-stone-600 dark:text-stone-300">
                    {item.content}
                  </p>
                )}

                {/* Due Date / Expiry if set */}
                {item.dueDate && (
                  <div className="mt-2.5 flex items-center gap-1.5 text-xs font-semibold text-amber-600 dark:text-amber-400">
                    <Icon name="Calendar" className="h-3.5 w-3.5" />
                    <span>Due: {new Date(item.dueDate).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}</span>
                  </div>
                )}

                {/* Attachments Section with Paperclip (matching Image 3) */}
                {attachments.length > 0 && (
                  <div className="mt-3.5 pt-3 border-t border-stone-100 dark:border-zinc-800 space-y-1.5">
                    {attachments.map((att: any, attIdx: number) => (
                      <a
                        key={attIdx}
                        href={att.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-stone-50 dark:bg-zinc-800/80 hover:bg-rose-50 dark:hover:bg-zinc-700/80 text-xs font-semibold text-stone-700 dark:text-stone-200 hover:text-[#FF4D6D] transition-colors mr-2 mb-1 border border-stone-200/60 dark:border-zinc-700 shadow-2xs"
                      >
                        <span className="text-[#FF4D6D]">📎</span>
                        <span>{att.name}</span>
                        {att.size && (
                          <span className="text-[10px] text-stone-400 font-normal">
                            ({(att.size / (1024 * 1024)).toFixed(2)} MB)
                          </span>
                        )}
                        <Icon name="Download" className="h-3 w-3 ml-0.5 opacity-60" />
                      </a>
                    ))}
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      )}

      {/* AI Coach Studio Accordion / Quick Ask Bar */}
      <div className="rounded-3xl border border-indigo-200/60 dark:border-indigo-900/50 bg-gradient-to-br from-indigo-50/50 via-purple-50/30 to-background dark:from-zinc-900 dark:via-zinc-900 p-5 shadow-xs">
        <div className="flex items-center justify-between gap-3 border-b border-indigo-100 dark:border-zinc-800 pb-3">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white text-base shadow-xs">
              🤖
            </span>
            <div>
              <h4 className="font-bold text-sm text-stone-900 dark:text-stone-100">
                {coach.name}
              </h4>
              <p className="text-xs text-stone-500">{coach.tagline}</p>
            </div>
          </div>
          <button
            onClick={() => openCoach(coachType)}
            className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
          >
            Open Full Studio →
          </button>
        </div>

        <div className="mt-3 flex flex-wrap gap-1.5">
          {coach.suggestedQuestions.slice(0, 3).map((q, idx) => (
            <button
              key={idx}
              onClick={() => openCoach(coachType, q)}
              className="px-3 py-1.5 rounded-full text-xs font-medium bg-white dark:bg-zinc-800 border border-stone-200/80 dark:border-zinc-700 hover:border-indigo-400 text-stone-700 dark:text-stone-300 transition-colors text-left"
            >
              💡 {q}
            </button>
          ))}
        </div>
      </div>

      {/* Floating Bottom Button */}
      <div className="fixed bottom-5 left-0 right-0 z-30 flex justify-center px-4 pointer-events-none">
        <div className="pointer-events-auto">
          <button
            onClick={() => {
              setDefaultAddType("note");
              setAddItemOpen(true);
            }}
            className="rounded-full bg-[#FF4D6D] hover:bg-[#FF3358] text-white font-extrabold text-sm sm:text-base py-3.5 px-8 shadow-xl shadow-rose-500/30 flex items-center gap-2.5 transition-all hover:scale-105 active:scale-95 cursor-pointer"
          >
            <Icon name="Plus" className="h-5 w-5" strokeWidth={3} />
            <span>+ Add to {domainMeta.short}</span>
          </button>
        </div>
      </div>

      {/* Add Item Modal */}
      <AddItemModal
        open={addItemOpen}
        onOpenChange={setAddItemOpen}
        domainKey={domainMeta.key}
        domainId={domainId}
        defaultType={defaultAddType}
        onSuccess={loadItems}
      />

      {/* Easy Upload Modal */}
      <EasyUploadModal
        open={uploadModalOpen}
        onOpenChange={setUploadModalOpen}
        defaultCategory={domainMeta.key}
        onSuccess={loadItems}
      />
    </div>
  );
}
