"use client";

import { useState, useEffect } from "react";
import { useLifeOS } from "@/store/life-os";
import { DOMAINS, DOMAIN_MAP } from "@/lib/constants";
import { Icon } from "../icon";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { toast } from "sonner";

export function TimelineView() {
  const { openItemDetail, openVault, openCoach } = useLifeOS();
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [birthDate, setBirthDate] = useState<string | null>(null);

  async function loadTimeline() {
    setLoading(true);
    try {
      const url = selectedCategory === "all" ? "/api/timeline" : `/api/timeline?category=${selectedCategory}`;
      const res = await fetch(url);
      if (res.ok) {
        const json = await res.json();
        setEntries(json.entries || []);
        if (json.birthDate) setBirthDate(json.birthDate);
      }
    } catch {
      toast.error("Failed to load timeline records");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTimeline();
  }, [selectedCategory]);

  // Group entries by Year
  const groupedByYear = entries.reduce((acc: Record<string, any[]>, entry) => {
    const year = new Date(entry.date).getFullYear().toString();
    if (!acc[year]) acc[year] = [];
    acc[year].push(entry);
    return acc;
  }, {});

  const years = Object.keys(groupedByYear).sort((a, b) => parseInt(b) - parseInt(a)); // Descending

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-sm">
              <Icon name="Milestone" className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Personal Life Timeline</h1>
              <p className="text-sm text-muted-foreground">
                Chronological record of verified milestones, degrees, deeds, career wins, and life events.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="rounded-xl border border-border/60 bg-muted/30 px-3.5 py-1.5 text-xs text-muted-foreground">
            <span className="font-semibold text-foreground">{entries.length}</span> milestones recorded
          </div>
        </div>
      </div>

      {/* Category filter pills */}
      <div className="flex items-center gap-2 overflow-x-auto rounded-2xl border border-border/60 bg-card/60 p-2 shadow-xs backdrop-blur-sm">
        <button
          onClick={() => setSelectedCategory("all")}
          className={cn(
            "rounded-xl px-3 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap",
            selectedCategory === "all" ? "bg-foreground text-background" : "bg-muted/40 text-muted-foreground hover:bg-muted"
          )}
        >
          All Areas ({entries.length})
        </button>
        {DOMAINS.map((dom) => (
          <button
            key={dom.key}
            onClick={() => setSelectedCategory(dom.key)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap",
              selectedCategory === dom.key
                ? "bg-indigo-600 text-white"
                : "bg-muted/40 text-muted-foreground hover:bg-muted"
            )}
          >
            <Icon name={dom.icon} className="h-3 w-3" />
            {dom.short}
          </button>
        ))}
      </div>

      {/* Timeline Stream */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 animate-pulse rounded-2xl border border-border/40 bg-muted/30" />
          ))}
        </div>
      ) : entries.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/80 bg-card/30 p-12 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-500">
            <Icon name="Compass" className="h-6 w-6" />
          </div>
          <h3 className="mt-4 text-base font-semibold">No milestones logged yet</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Add milestones, degrees, jobs, or upload dated documents in your vault to visualize your personal journey.
          </p>
        </div>
      ) : (
        <div className="relative border-l-2 border-border/60 pl-6 sm:pl-8 ml-3 space-y-10">
          {years.map((year) => {
            const itemsInYear = groupedByYear[year];
            return (
              <div key={year} className="relative space-y-4">
                {/* Year Marker */}
                <div className="flex items-center gap-3 -ml-[33px] sm:-ml-[41px]">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600 text-xs font-bold text-white shadow-sm ring-4 ring-background">
                    <Icon name="Calendar" className="h-4 w-4" />
                  </div>
                  <h2 className="text-xl font-bold tracking-tight text-foreground">{year}</h2>
                  <span className="text-xs text-muted-foreground">({itemsInYear.length} events)</span>
                </div>

                {/* Event Cards in Year */}
                <div className="space-y-3">
                  {itemsInYear.map((item: any) => {
                    const domain = DOMAIN_MAP[item.category] || DOMAIN_MAP.daily_personal;
                    const eventDate = new Date(item.date);

                    return (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="group relative rounded-2xl border border-border/60 bg-card p-4 shadow-xs transition-all hover:border-indigo-500/40 hover:shadow-md"
                      >
                        <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
                          <div className="flex items-center gap-2">
                            <span
                              className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
                              style={{ background: `${domain?.color}15`, color: domain?.color }}
                            >
                              <Icon name={domain?.icon || "Flag"} className="h-3 w-3" />
                              {domain?.short || item.categoryName}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {eventDate.toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                            </span>
                            {item.source === "document" && (
                              <span className="rounded-md bg-purple-500/10 px-2 py-0.2 text-[10px] font-bold text-purple-600 dark:text-purple-400">
                                Verified Vault Document
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            {item.source === "document" ? (
                              <button
                                onClick={() => openVault(item.category)}
                                className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:underline"
                              >
                                <Icon name="FileText" className="h-3.5 w-3.5" />
                                View in Vault
                              </button>
                            ) : (
                              <button
                                onClick={() => openItemDetail(item.id)}
                                className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:underline"
                              >
                                <Icon name="ExternalLink" className="h-3.5 w-3.5" />
                                View Details
                              </button>
                            )}
                          </div>
                        </div>

                        <h3 className="mt-2 text-base font-semibold tracking-tight text-foreground">
                          {item.title}
                        </h3>

                        {item.description && (
                          <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                            {item.description}
                          </p>
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
