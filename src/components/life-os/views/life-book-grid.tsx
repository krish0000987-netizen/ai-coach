"use client";

import { useState, useEffect } from "react";
import { useLifeOS } from "@/store/life-os";
import { DOMAINS, DomainMeta } from "@/lib/constants";
import { Icon } from "../icon";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { EasyUploadModal } from "../easy-upload-modal";
import { toast } from "sonner";

export function LifeBookGrid() {
  const { setView, openCoach } = useLifeOS();
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [draggedOverCategory, setDraggedOverCategory] = useState<string | null>(null);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [targetUploadCategory, setTargetUploadCategory] = useState<string>("health_wellness");
  const [greeting, setGreeting] = useState("Life Book");

  // Fetch item and document counts for all domains
  async function loadCounts() {
    try {
      const [itemsRes, docsRes] = await Promise.all([
        fetch("/api/items?status=active,done"),
        fetch("/api/documents"),
      ]);

      const itemsData = itemsRes.ok ? await itemsRes.json() : { items: [] };
      const docsData = docsRes.ok ? await docsRes.json() : { documents: [] };

      const cMap: Record<string, number> = {};

      // Initialize
      DOMAINS.forEach((d) => {
        cMap[d.key] = 0;
      });

      // Count items by domain
      (itemsData.items || []).forEach((item: any) => {
        const domainKey = item.domain?.key || item.domainId;
        if (domainKey) {
          cMap[domainKey] = (cMap[domainKey] || 0) + 1;
        }
      });

      // Count docs by category
      (docsData.documents || []).forEach((doc: any) => {
        if (doc.category) {
          cMap[doc.category] = (cMap[doc.category] || 0) + 1;
        }
      });

      setCounts(cMap);
    } catch {
      // ignore
    }
  }

  useEffect(() => {
    loadCounts();
    const h = new Date().getHours();
    setGreeting(h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening");
  }, []);

  // Handle direct file drop onto category card
  async function handleCardDrop(e: React.DragEvent, domainKey: string) {
    e.preventDefault();
    e.stopPropagation();
    setDraggedOverCategory(null);

    const files = Array.from(e.dataTransfer.files);
    if (files.length === 0) return;

    toast.info(`Uploading ${files.length} file${files.length > 1 ? "s" : ""} to ${DOMAINS.find(d => d.key === domainKey)?.short}...`);

    let uploaded = 0;
    for (const file of files) {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("title", file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " "));
      formData.append("category", domainKey);
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
      toast.success(`Uploaded ${uploaded} file${uploaded > 1 ? "s" : ""} to ${DOMAINS.find(d => d.key === domainKey)?.short}!`);
      loadCounts();
    }
  }

  const filteredDomains = DOMAINS.filter((d) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      d.name.toLowerCase().includes(q) ||
      d.short.toLowerCase().includes(q) ||
      d.description.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6 pb-24 max-w-4xl mx-auto px-2 sm:px-4">
      {/* Header Banner — matching Macaron "Life Book" style */}
      <motion.div
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl border border-stone-200/70 dark:border-zinc-800 bg-gradient-to-r from-rose-50 via-pink-50/60 to-amber-50/40 dark:from-zinc-900 dark:via-zinc-900/90 dark:to-zinc-800 p-6 sm:p-7 shadow-xs"
      >
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-[#FF4D6D]/15 text-[#FF4D6D] text-xs">
                ✨
              </span>
              <p className="text-xs font-bold uppercase tracking-wider text-[#FF4D6D]">
                Life Book
              </p>
            </div>
            <h1 className="mt-1.5 text-2xl sm:text-3xl font-extrabold tracking-tight text-stone-900 dark:text-stone-100">
              Personal Vault & OS
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-stone-600 dark:text-stone-400">
              Shared by You · Private, encrypted & AI-guided records across all 11 life areas.
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-shrink-0">
            <button
              onClick={() => {
                setTargetUploadCategory("health_wellness");
                setUploadModalOpen(true);
              }}
              className="inline-flex items-center gap-2 rounded-full bg-[#FF4D6D] hover:bg-[#FF3358] px-5 py-2.5 text-xs font-bold text-white shadow-md transition-all active:scale-95 cursor-pointer"
            >
              <Icon name="Upload" className="h-4 w-4" />
              <span>Easy Upload</span>
            </button>
            <button
              onClick={() => setView("reminders")}
              className="inline-flex items-center gap-2 rounded-full border border-stone-200 dark:border-zinc-700 bg-white/80 dark:bg-zinc-800 px-4 py-2.5 text-xs font-semibold text-stone-700 dark:text-stone-200 hover:bg-white transition-colors cursor-pointer"
            >
              <Icon name="BellRing" className="h-4 w-4 text-amber-500" />
              <span>Reminders</span>
            </button>
          </div>
        </div>
      </motion.div>

      {/* Search Bar */}
      <div className="relative">
        <Icon
          name="Search"
          className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400 pointer-events-none"
        />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search categories, records, blood reports, passport, or notes..."
          className="w-full rounded-2xl border border-stone-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 pl-11 pr-4 py-3 text-sm text-stone-900 dark:text-stone-100 placeholder:text-stone-400 shadow-xs focus:outline-none focus:ring-2 focus:ring-[#FF4D6D]/40"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery("")}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-stone-400 hover:text-stone-700"
          >
            Clear
          </button>
        )}
      </div>

      {/* 2-Column Category Grid — Exactly matching uploaded screenshots */}
      <div className="grid grid-cols-2 gap-3.5 sm:gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredDomains.map((dom, idx) => {
          const itemCount = counts[dom.key] || 0;
          const isDragOver = draggedOverCategory === dom.key;

          return (
            <motion.div
              key={dom.key}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.03, duration: 0.2 }}
              onDragOver={(e) => {
                e.preventDefault();
                setDraggedOverCategory(dom.key);
              }}
              onDragLeave={() => setDraggedOverCategory(null)}
              onDrop={(e) => handleCardDrop(e, dom.key)}
              onClick={() => setView(dom.key as any)}
              className={cn(
                "group relative flex flex-col items-center justify-between rounded-3xl border p-5 sm:p-6 text-center cursor-pointer transition-all duration-200 min-h-[165px] sm:min-h-[175px]",
                isDragOver
                  ? "border-[#FF4D6D] bg-[#FF4D6D]/10 ring-4 ring-[#FF4D6D]/20 scale-[1.02]"
                  : "border-stone-200/70 dark:border-zinc-800 bg-white dark:bg-zinc-900/90 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-md hover:-translate-y-1"
              )}
            >
              {/* Category Pastel Icon Box */}
              <div
                className="flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-2xl text-2xl sm:text-3xl shadow-xs transition-transform duration-200 group-hover:scale-105"
                style={{ background: dom.bgSoft }}
              >
                {dom.emoji}
              </div>

              {/* Category Title */}
              <div className="mt-3 min-w-0">
                <h3 className="text-base sm:text-lg font-bold text-stone-900 dark:text-stone-100 group-hover:text-[#FF4D6D] transition-colors leading-tight">
                  {dom.short}
                </h3>
              </div>

              {/* Subtitle / Item Count Badge */}
              <div className="mt-2.5">
                {isDragOver ? (
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-[#FF4D6D] animate-bounce">
                    Drop to upload!
                  </span>
                ) : itemCount > 0 ? (
                  <span
                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold"
                    style={{
                      background: dom.badgeBg,
                      color: dom.badgeText,
                    }}
                  >
                    {itemCount} {itemCount === 1 ? "item" : "items"}
                  </span>
                ) : (
                  <span className="text-stone-400 group-hover:text-stone-600 transition-colors text-sm font-medium">
                    <Icon name="ChevronRight" className="h-4 w-4" />
                  </span>
                )}
              </div>

              {/* Subtle hover upload indicator */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setTargetUploadCategory(dom.key);
                  setUploadModalOpen(true);
                }}
                className="absolute top-2.5 right-2.5 h-7 w-7 rounded-full bg-stone-100 dark:bg-zinc-800 text-stone-500 hover:bg-[#FF4D6D] hover:text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-xs"
                title={`Quick upload to ${dom.short}`}
              >
                <Icon name="Plus" className="h-3.5 w-3.5" />
              </button>
            </motion.div>
          );
        })}
      </div>

      {/* Floating Bottom Action Bar — matching "Open Macaron App" red button */}
      <div className="fixed bottom-5 left-0 right-0 z-30 flex justify-center px-4 pointer-events-none">
        <div className="pointer-events-auto">
          <button
            onClick={() => {
              setTargetUploadCategory("health_wellness");
              setUploadModalOpen(true);
            }}
            className="rounded-full bg-[#FF4D6D] hover:bg-[#FF3358] text-white font-extrabold text-sm sm:text-base py-3.5 px-8 shadow-xl shadow-rose-500/30 flex items-center gap-2.5 transition-all hover:scale-105 active:scale-95 cursor-pointer"
          >
            <Icon name="Plus" className="h-5 w-5" strokeWidth={3} />
            <span>Upload or Add to Life Book</span>
          </button>
        </div>
      </div>

      {/* Easy Upload Modal */}
      <EasyUploadModal
        open={uploadModalOpen}
        onOpenChange={setUploadModalOpen}
        defaultCategory={targetUploadCategory}
        onSuccess={loadCounts}
      />
    </div>
  );
}
