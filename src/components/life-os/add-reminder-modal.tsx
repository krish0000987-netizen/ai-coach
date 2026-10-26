"use client";

import { useState } from "react";
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

interface AddReminderModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultCategory?: string;
  onSuccess?: () => void;
}

export function AddReminderModal({
  open,
  onOpenChange,
  defaultCategory = "health_wellness",
  onSuccess,
}: AddReminderModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState(defaultCategory);
  const [dateOption, setDateOption] = useState<"today" | "tomorrow" | "in3days" | "nextweek" | "custom">("tomorrow");
  const [customDate, setCustomDate] = useState("");
  const [reminderTime, setReminderTime] = useState("09:00");
  const [saving, setSaving] = useState(false);

  function calculateTargetDate(): Date {
    const d = new Date();
    if (dateOption === "today") {
      // keep today
    } else if (dateOption === "tomorrow") {
      d.setDate(d.getDate() + 1);
    } else if (dateOption === "in3days") {
      d.setDate(d.getDate() + 3);
    } else if (dateOption === "nextweek") {
      d.setDate(d.getDate() + 7);
    } else if (dateOption === "custom" && customDate) {
      const parsed = new Date(customDate);
      if (!isNaN(parsed.getTime())) return parsed;
    }

    if (reminderTime) {
      const [h, m] = reminderTime.split(":").map(Number);
      d.setHours(h || 9, m || 0, 0, 0);
    }
    return d;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Please enter a reminder title.");
      return;
    }

    setSaving(true);
    try {
      const remindAt = calculateTargetDate();

      const res = await fetch("/api/reminders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || null,
          category,
          type: "custom",
          remindAt: remindAt.toISOString(),
          dueDate: remindAt.toISOString(),
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to create reminder");
      }

      toast.success("Reminder created successfully!");
      setTitle("");
      setDescription("");
      onOpenChange(false);
      onSuccess?.();
    } catch (err: any) {
      toast.error(err.message || "Failed to create reminder");
    } finally {
      setSaving(false);
    }
  }

  const currentCat = DOMAIN_MAP[category] || DOMAINS[0];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md rounded-3xl p-6 border-stone-200/80 dark:border-zinc-800 bg-card">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div
              className="flex h-11 w-11 items-center justify-center rounded-2xl text-2xl shadow-xs"
              style={{ background: currentCat.bgSoft }}
            >
              🔔
            </div>
            <div>
              <DialogTitle className="text-xl font-bold tracking-tight text-foreground">
                Set Reminder
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Schedule smart notifications for checkups, bills, renewals, or daily habits.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {/* Title */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground block mb-1">
              Reminder Title *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Schedule Blood Test, Renew Passport, Review Investments..."
              className="w-full rounded-2xl border border-border/80 bg-background px-3.5 py-2.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#FF4D6D]/40 font-semibold"
            />
          </div>

          {/* Category Picker */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground block mb-1.5">
              Category
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5 max-h-32 overflow-y-auto p-1 border border-border/60 rounded-2xl bg-muted/20">
              {DOMAINS.map((dom) => (
                <button
                  key={dom.key}
                  type="button"
                  onClick={() => setCategory(dom.key)}
                  className={cn(
                    "flex items-center gap-1.5 p-1.5 rounded-xl text-left text-xs transition-all border",
                    category === dom.key
                      ? "border-[#FF4D6D] bg-[#FF4D6D]/10 font-bold text-foreground"
                      : "border-transparent hover:bg-muted/60 text-muted-foreground hover:text-foreground"
                  )}
                >
                  <span
                    className="flex h-5 w-5 items-center justify-center rounded-md text-xs flex-shrink-0"
                    style={{ background: dom.bgSoft }}
                  >
                    {dom.emoji}
                  </span>
                  <span className="truncate text-[11px]">{dom.short}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Quick Date Presets */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground block mb-1.5">
              When should we remind you?
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
              {[
                { id: "today", label: "Today" },
                { id: "tomorrow", label: "Tomorrow" },
                { id: "in3days", label: "In 3 Days" },
                { id: "nextweek", label: "Next Week" },
              ].map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => setDateOption(preset.id as any)}
                  className={cn(
                    "py-2 px-3 rounded-2xl text-xs font-semibold border transition-all text-center",
                    dateOption === preset.id
                      ? "bg-[#FF4D6D] text-white border-[#FF4D6D] shadow-xs"
                      : "bg-muted/40 text-muted-foreground hover:bg-muted border-border/70"
                  )}
                >
                  {preset.label}
                </button>
              ))}
            </div>

            <div className="mt-2 flex items-center gap-2">
              <input
                type="date"
                value={customDate}
                onChange={(e) => {
                  setCustomDate(e.target.value);
                  setDateOption("custom");
                }}
                className={cn(
                  "flex-1 rounded-2xl border px-3 py-1.5 text-xs text-foreground bg-background",
                  dateOption === "custom" ? "border-[#FF4D6D] ring-2 ring-[#FF4D6D]/30" : "border-border/80"
                )}
              />
              <input
                type="time"
                value={reminderTime}
                onChange={(e) => setReminderTime(e.target.value)}
                className="w-24 rounded-2xl border border-border/80 bg-background px-2.5 py-1.5 text-xs text-foreground"
              />
            </div>
          </div>

          {/* Details / Notes */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground block mb-1">
              Notes (Optional)
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add instructions, clinic location, renewal links..."
              className="w-full rounded-2xl border border-border/80 bg-background px-3.5 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#FF4D6D]/40 resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/60">
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
                  <span>Setting reminder...</span>
                </>
              ) : (
                <>
                  <Icon name="Bell" className="h-4 w-4" />
                  <span>Set Reminder</span>
                </>
              )}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
