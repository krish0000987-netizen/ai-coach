"use client";

import { useState, useEffect } from "react";
import { useLifeOS } from "@/store/life-os";
import { DOMAIN_MAP } from "@/lib/constants";
import { Icon } from "../icon";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

export function RemindersView() {
  const { openVault, openItemDetail, openCoach } = useLifeOS();
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

  const currentList =
    activeTab === "all"
      ? data.all
      : activeTab === "overdue"
      ? data.overdue
      : activeTab === "dueSoon"
      ? data.dueSoon
      : activeTab === "upcoming"
      ? data.upcoming
      : data.completed;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-sm">
              <Icon name="BellRing" className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Predictive Alerts & Reminders</h1>
              <p className="text-sm text-muted-foreground">
                Deterministic date auditing for passport expiries, insurance renewals, and wellness milestones.
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={runPredictiveScan}
          disabled={scanning}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:opacity-95 disabled:opacity-50"
        >
          {scanning ? (
            <>
              <Icon name="Loader2" className="h-4 w-4 animate-spin" />
              Scanning Records…
            </>
          ) : (
            <>
              <Icon name="Sparkles" className="h-4 w-4" />
              Run Predictive Audit
            </>
          )}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-border/40 pb-2">
        <button
          onClick={() => setActiveTab("all")}
          className={cn(
            "rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-colors",
            activeTab === "all" ? "bg-foreground text-background" : "text-muted-foreground hover:bg-muted"
          )}
        >
          All Alerts ({data.stats?.total || 0})
        </button>

        <button
          onClick={() => setActiveTab("overdue")}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-colors",
            activeTab === "overdue" ? "bg-rose-600 text-white" : "text-muted-foreground hover:bg-muted"
          )}
        >
          <span>Overdue</span>
          {data.stats?.overdueCount > 0 && (
            <span className="rounded-full bg-rose-500/20 px-1.5 py-0.2 text-[10px] font-bold">
              {data.stats.overdueCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab("dueSoon")}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-colors",
            activeTab === "dueSoon" ? "bg-amber-600 text-white" : "text-muted-foreground hover:bg-muted"
          )}
        >
          <span>Due in 7 Days</span>
          {data.stats?.dueSoonCount > 0 && (
            <span className="rounded-full bg-amber-500/20 px-1.5 py-0.2 text-[10px] font-bold">
              {data.stats.dueSoonCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab("upcoming")}
          className={cn(
            "rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-colors",
            activeTab === "upcoming" ? "bg-foreground text-background" : "text-muted-foreground hover:bg-muted"
          )}
        >
          Upcoming ({data.upcoming?.length || 0})
        </button>

        <button
          onClick={() => setActiveTab("completed")}
          className={cn(
            "rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-colors",
            activeTab === "completed" ? "bg-foreground text-background" : "text-muted-foreground hover:bg-muted"
          )}
        >
          Completed ({data.stats?.completedCount || 0})
        </button>
      </div>

      {/* Reminder Cards */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-2xl border border-border/40 bg-muted/30" />
          ))}
        </div>
      ) : currentList.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/80 bg-card/30 p-12 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-500">
            <Icon name="CheckCheck" className="h-6 w-6" />
          </div>
          <h3 className="mt-4 text-base font-semibold">No alerts in this category</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            You're completely on top of your deadlines! Click "Run Predictive Audit" anytime to check your records.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {currentList.map((rem) => {
            const domain = rem.category ? DOMAIN_MAP[rem.category] : null;
            const now = new Date();
            const remindDate = new Date(rem.remindAt);
            const isOverdue = remindDate < now && rem.status === "pending";

            return (
              <motion.div
                key={rem.id}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn(
                  "flex flex-col justify-between gap-4 rounded-2xl border p-4.5 shadow-xs transition-all sm:flex-row sm:items-center",
                  isOverdue
                    ? "border-rose-500/30 bg-rose-500/5 hover:border-rose-500/50"
                    : rem.status === "completed"
                    ? "border-border/40 bg-muted/20 opacity-70"
                    : "border-border/60 bg-card hover:border-amber-500/40"
                )}
              >
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    {domain && (
                      <span
                        className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase"
                        style={{ background: `${domain.color}20`, color: domain.color }}
                      >
                        {domain.short}
                      </span>
                    )}
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-[10px] font-bold uppercase",
                        isOverdue
                          ? "bg-rose-500/20 text-rose-600"
                          : rem.type === "expiry"
                          ? "bg-amber-500/20 text-amber-600"
                          : "bg-indigo-500/20 text-indigo-600"
                      )}
                    >
                      {rem.type.replace(/_/g, " ")}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      Remind: {new Date(rem.remindAt).toLocaleDateString()}
                    </span>
                  </div>

                  <h3 className={cn("text-sm font-semibold tracking-tight", rem.status === "completed" && "line-through text-muted-foreground")}>
                    {rem.title}
                  </h3>

                  {rem.description && (
                    <p className="text-xs text-muted-foreground max-w-2xl">{rem.description}</p>
                  )}

                  {/* Linked document / item metadata */}
                  {rem.document && (
                    <div className="flex items-center gap-1.5 pt-1 text-xs text-indigo-600 dark:text-indigo-400">
                      <Icon name="FileText" className="h-3.5 w-3.5" />
                      <span>Linked Vault Document: {rem.document.title}</span>
                      <button
                        onClick={() => openVault(rem.document.category)}
                        className="ml-1 underline font-medium hover:text-indigo-700"
                      >
                        View in Vault
                      </button>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  {rem.status !== "completed" && (
                    <>
                      <button
                        onClick={() => handleAction(rem.id, "complete")}
                        className="inline-flex items-center gap-1 rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-emerald-700"
                      >
                        <Icon name="Check" className="h-3.5 w-3.5" />
                        Complete
                      </button>

                      <div className="relative group">
                        <button
                          onClick={() => handleAction(rem.id, "snooze", 3)}
                          className="inline-flex items-center gap-1 rounded-xl border border-border px-2.5 py-1.5 text-xs font-medium hover:bg-muted"
                          title="Snooze 3 days"
                        >
                          <Icon name="Clock" className="h-3.5 w-3.5" />
                          Snooze
                        </button>
                      </div>

                      <button
                        onClick={() => openCoach(domain?.coachType || "predictive")}
                        className="rounded-xl border border-border p-1.5 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/40"
                        title="Consult Predictive Coach"
                      >
                        <Icon name="Sparkles" className="h-4 w-4" />
                      </button>
                    </>
                  )}

                  <button
                    onClick={() => handleDelete(rem.id)}
                    className="rounded-xl border border-border p-1.5 text-muted-foreground hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40"
                    title="Dismiss / Delete"
                  >
                    <Icon name="Trash2" className="h-4 w-4" />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
