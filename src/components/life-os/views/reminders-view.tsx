"use client";

import { useState, useEffect } from "react";
import { useLifeOS } from "@/store/life-os";
import { DOMAINS, DOMAIN_MAP } from "@/lib/constants";
import { Icon } from "../icon";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { AddReminderModal } from "../add-reminder-modal";

export function RemindersView() {
  const { openVault, openItemDetail, setView } = useLifeOS();
  const [data, setData] = useState<{
    all: any[];
    overdue: any[];
    dueSoon: any[];
    upcoming: any[];
    completed: any[];
    stats: any;
  }>({
    all: [],
    overdue: [],
    dueSoon: [],
    upcoming: [],
    completed: [],
    stats: { total: 0, overdueCount: 0, dueSoonCount: 0, completedCount: 0 },
  });
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [activeTab, setActiveTab] = useState<"all" | "overdue" | "dueSoon" | "upcoming" | "completed">("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [addReminderOpen, setAddReminderOpen] = useState(false);

  async function loadReminders() {
    setLoading(true);
    try {
      const res = await fetch("/api/reminders");
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch {
      toast.error("Failed to load reminders");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadReminders();
  }, []);

  // Run proactive predictive scan
  async function runPredictiveScan() {
    setScanning(true);
    try {
      const res = await fetch("/api/reminders/scan", { method: "POST" });
      const result = await res.json();
      if (res.ok) {
        if (result.createdCount > 0) {
          toast.success(`Predictive Scan complete: detected ${result.createdCount} new renewal or checkup alerts!`);
        } else {
          toast.info("Predictive Scan complete: all active documents and deadlines are up to date.");
        }
        loadReminders();
      } else {
        toast.error("Scan failed: " + result.error);
      }
    } catch {
      toast.error("Error executing predictive scan");
    } finally {
      setScanning(false);
    }
  }

  // Handle reminder action
  async function handleAction(reminderId: string, action: "complete" | "dismiss" | "snooze", snoozeDays = 1) {
    try {
      const res = await fetch(`/api/reminders/${reminderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, snoozeDays }),
      });
      if (res.ok) {
        toast.success(action === "snooze" ? `Snoozed for ${snoozeDays} day${snoozeDays > 1 ? "s" : ""}` : `Marked as ${action}d`);
        loadReminders();
      }
    } catch {
      toast.error("Action failed");
    }
  }

  // Delete reminder
  async function handleDelete(reminderId: string) {
    try {
      const res = await fetch(`/api/reminders/${reminderId}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Reminder deleted");
        loadReminders();
      }
    } catch {
      toast.error("Delete failed");
    }
  }

  const baseList =
    activeTab === "all"
      ? data.all
      : activeTab === "overdue"
      ? data.overdue
      : activeTab === "dueSoon"
      ? data.dueSoon
      : activeTab === "upcoming"
      ? data.upcoming
      : data.completed;

  const currentList = baseList.filter((item) => {
    if (selectedCategory === "all") return true;
    return item.category === selectedCategory;
  });

  return (
    <div className="space-y-6 pb-28 max-w-4xl mx-auto px-2 sm:px-4">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-stone-200/70 dark:border-zinc-800 bg-gradient-to-r from-amber-100/60 via-orange-50/40 to-rose-100/30 dark:from-zinc-900 dark:via-zinc-900/90 dark:to-zinc-800 p-6 sm:p-7 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-amber-500/15 text-amber-600 text-xs font-bold">
                🔔
              </span>
              <p className="text-xs font-bold uppercase tracking-wider text-amber-600">
                Predictive Alerts
              </p>
            </div>
            <h1 className="mt-1 text-2xl sm:text-3xl font-extrabold tracking-tight text-stone-900 dark:text-stone-100">
              Reminders & Expiries
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-stone-600 dark:text-stone-400">
              Deterministic date auditing for passport expiries, renewals, and wellness checkups.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setAddReminderOpen(true)}
              className="inline-flex items-center gap-2 rounded-full bg-[#FF4D6D] hover:bg-[#FF3358] px-5 py-2.5 text-xs font-bold text-white shadow-md transition-all active:scale-95 cursor-pointer"
            >
              <Icon name="Plus" className="h-4 w-4" strokeWidth={3} />
              <span>+ Add Reminder</span>
            </button>

            <button
              onClick={runPredictiveScan}
              disabled={scanning}
              className="inline-flex items-center gap-2 rounded-full border border-stone-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-4 py-2.5 text-xs font-bold text-stone-700 dark:text-stone-200 hover:bg-stone-50 transition-colors disabled:opacity-50 cursor-pointer"
            >
              {scanning ? (
                <>
                  <Icon name="Loader2" className="h-3.5 w-3.5 animate-spin" />
                  <span>Auditing...</span>
                </>
              ) : (
                <>
                  <Icon name="Sparkles" className="h-3.5 w-3.5 text-amber-500" />
                  <span>Audit Expiries</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Top Stat Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <button
          onClick={() => setActiveTab("all")}
          className={cn(
            "p-3.5 rounded-2xl border text-left transition-all",
            activeTab === "all"
              ? "border-[#FF4D6D] bg-[#FF4D6D]/10 text-foreground"
              : "border-stone-200/70 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-stone-600 hover:border-stone-300"
          )}
        >
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Total Alerts</span>
          <p className="text-xl font-extrabold text-foreground mt-0.5">{data.stats?.total || 0}</p>
        </button>

        <button
          onClick={() => setActiveTab("overdue")}
          className={cn(
            "p-3.5 rounded-2xl border text-left transition-all",
            activeTab === "overdue"
              ? "border-rose-500 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 font-bold"
              : "border-stone-200/70 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-stone-600 hover:border-stone-300"
          )}
        >
          <span className="text-[10px] font-bold uppercase tracking-wider text-rose-500">Overdue</span>
          <p className="text-xl font-extrabold text-rose-600 mt-0.5">{data.stats?.overdueCount || 0}</p>
        </button>

        <button
          onClick={() => setActiveTab("dueSoon")}
          className={cn(
            "p-3.5 rounded-2xl border text-left transition-all",
            activeTab === "dueSoon"
              ? "border-amber-500 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 font-bold"
              : "border-stone-200/70 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-stone-600 hover:border-stone-300"
          )}
        >
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-500">Due in 7 Days</span>
          <p className="text-xl font-extrabold text-amber-600 mt-0.5">{data.stats?.dueSoonCount || 0}</p>
        </button>

        <button
          onClick={() => setActiveTab("completed")}
          className={cn(
            "p-3.5 rounded-2xl border text-left transition-all",
            activeTab === "completed"
              ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-bold"
              : "border-stone-200/70 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-stone-600 hover:border-stone-300"
          )}
        >
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">Completed</span>
          <p className="text-xl font-extrabold text-emerald-600 mt-0.5">{data.stats?.completedCount || 0}</p>
        </button>
      </div>

      {/* Category Filter Chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        <button
          onClick={() => setSelectedCategory("all")}
          className={cn(
            "px-3.5 py-1.5 rounded-full text-xs font-bold transition-all border whitespace-nowrap cursor-pointer",
            selectedCategory === "all"
              ? "bg-stone-900 text-white dark:bg-white dark:text-stone-900 border-transparent shadow-xs"
              : "bg-white dark:bg-zinc-900 border-stone-200/80 dark:border-zinc-800 text-stone-600 hover:bg-stone-100"
          )}
        >
          All Categories
        </button>
        {DOMAINS.map((dom) => {
          const isSelected = selectedCategory === dom.key;
          return (
            <button
              key={dom.key}
              onClick={() => setSelectedCategory(dom.key)}
              className={cn(
                "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all border whitespace-nowrap cursor-pointer",
                isSelected
                  ? "border-[#FF4D6D] bg-[#FF4D6D]/15 text-[#FF4D6D] font-bold"
                  : "bg-white dark:bg-zinc-900 border-stone-200/80 dark:border-zinc-800 text-stone-600 hover:bg-stone-100"
              )}
            >
              <span>{dom.emoji}</span>
              <span>{dom.short}</span>
            </button>
          );
        })}
      </div>

      {/* Reminders List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-28 rounded-3xl bg-stone-100 dark:bg-zinc-800 animate-pulse" />
          ))}
        </div>
      ) : currentList.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-stone-200 dark:border-zinc-800 bg-white/60 dark:bg-zinc-900/40 p-10 text-center space-y-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 text-amber-600 text-2xl mx-auto">
            🔔
          </div>
          <h3 className="text-base font-bold text-stone-900 dark:text-stone-100">
            No reminders in this view
          </h3>
          <p className="text-xs text-stone-500 max-w-sm mx-auto">
            You're all caught up! Click below to create a custom reminder for any medical checkup, bill, or passport expiry.
          </p>
          <div className="pt-2">
            <button
              onClick={() => setAddReminderOpen(true)}
              className="px-6 py-2.5 rounded-full bg-[#FF4D6D] text-white text-xs font-bold shadow-md hover:bg-[#FF3358] cursor-pointer"
            >
              + Create Reminder
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {currentList.map((rem) => {
            const isCompleted = rem.status === "completed";
            const remindDate = new Date(rem.remindAt);
            const now = new Date();
            const isOverdue = !isCompleted && remindDate < now;
            const diffDays = Math.round((remindDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
            const catMeta = DOMAIN_MAP[rem.category] || DOMAINS[0];

            return (
              <motion.div
                key={rem.id}
                layout
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn(
                  "rounded-3xl border border-stone-200/70 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 shadow-xs hover:shadow-md transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4",
                  isCompleted && "opacity-60 bg-stone-50/50"
                )}
              >
                <div className="flex items-start gap-3.5 min-w-0">
                  {/* Complete checkmark toggle */}
                  <button
                    onClick={() => handleAction(rem.id, isCompleted ? "dismiss" : "complete")}
                    className={cn(
                      "mt-0.5 flex h-7 w-7 items-center justify-center rounded-full border-2 transition-all flex-shrink-0 cursor-pointer",
                      isCompleted
                        ? "border-emerald-500 bg-emerald-500 text-white"
                        : "border-stone-300 dark:border-zinc-600 hover:border-[#FF4D6D] text-transparent hover:text-stone-400"
                    )}
                    aria-label="Toggle completed"
                  >
                    <Icon name="Check" className="h-4 w-4 stroke-[3]" />
                  </button>

                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3
                        className={cn(
                          "text-base font-bold text-stone-900 dark:text-stone-100",
                          isCompleted && "line-through text-stone-400"
                        )}
                      >
                        {rem.title}
                      </h3>

                      {catMeta && (
                        <span
                          className="px-2.5 py-0.5 rounded-full text-xs font-semibold flex items-center gap-1"
                          style={{ background: catMeta.badgeBg, color: catMeta.badgeText }}
                        >
                          <span>{catMeta.emoji}</span>
                          <span>{catMeta.short}</span>
                        </span>
                      )}

                      {isOverdue && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-rose-50 text-rose-600 border border-rose-200 animate-pulse">
                          Overdue
                        </span>
                      )}
                    </div>

                    {rem.description && (
                      <p className="mt-1 text-xs text-stone-600 dark:text-stone-400 line-clamp-2">
                        {rem.description}
                      </p>
                    )}

                    <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-stone-500">
                      <span className="inline-flex items-center gap-1 font-semibold text-stone-700 dark:text-stone-300">
                        <Icon name="CalendarClock" className="h-3.5 w-3.5 text-stone-400" />
                        <span>
                          {remindDate.toLocaleDateString(undefined, {
                            weekday: "short",
                            month: "short",
                            day: "numeric",
                          })}
                        </span>
                        <span>·</span>
                        <span>
                          {isCompleted
                            ? "Completed"
                            : isOverdue
                            ? `${Math.abs(diffDays)} day${Math.abs(diffDays) === 1 ? "" : "s"} overdue`
                            : diffDays === 0
                            ? "Due today"
                            : `In ${diffDays} day${diffDays === 1 ? "" : "s"}`}
                        </span>
                      </span>

                      {rem.document && (
                        <button
                          onClick={() => openVault(rem.category)}
                          className="inline-flex items-center gap-1 text-[#FF4D6D] hover:underline"
                        >
                          <Icon name="Paperclip" className="h-3 w-3" />
                          <span>Linked Document</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Action Buttons */}
                <div className="flex items-center gap-2 self-end sm:self-center flex-shrink-0">
                  {!isCompleted && (
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleAction(rem.id, "snooze", 1)}
                        className="px-3 py-1.5 rounded-xl border border-stone-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs font-semibold text-stone-700 dark:text-stone-300 hover:bg-stone-50 shadow-2xs"
                        title="Snooze 1 day"
                      >
                        +1 Day
                      </button>
                      <button
                        onClick={() => handleAction(rem.id, "snooze", 7)}
                        className="px-3 py-1.5 rounded-xl border border-stone-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs font-semibold text-stone-700 dark:text-stone-300 hover:bg-stone-50 shadow-2xs"
                        title="Snooze 1 week"
                      >
                        +1 Wk
                      </button>
                    </div>
                  )}

                  <button
                    onClick={() => handleDelete(rem.id)}
                    className="flex h-8 w-8 items-center justify-center rounded-xl bg-rose-50 text-rose-500 hover:bg-rose-100 transition-colors"
                    title="Delete Reminder"
                  >
                    <Icon name="Trash2" className="h-4 w-4" />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Add Reminder Modal */}
      <AddReminderModal
        open={addReminderOpen}
        onOpenChange={setAddReminderOpen}
        defaultCategory={selectedCategory !== "all" ? selectedCategory : "health_wellness"}
        onSuccess={loadReminders}
      />
    </div>
  );
}
