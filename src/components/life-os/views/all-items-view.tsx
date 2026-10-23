"use client";

import { useState } from "react";
import { useLifeOS } from "@/store/life-os";
import { useItems } from "@/lib/hooks";
import { Icon } from "../icon";
import { PageHeader, EmptyState } from "../layout";
import { ItemCard } from "../item-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ITEM_TYPES, ITEM_TYPE_MAP, DOMAINS } from "@/lib/constants";
import { cn } from "@/lib/utils";

export function AllItemsView() {
  const { openItemDetail, openItemEditor, openCoach, openVault } = useLifeOS();
  const [q, setQ] = useState("");
  const [typeFilter, setTypeFilter] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sort, setSort] = useState("updatedAt:desc");
  const [orderBy, order] = sort.split(":");

  const { data, isLoading } = useItems({
    ...(q ? { q } : {}),
    ...(typeFilter ? { type: typeFilter } : {}),
    status: statusFilter === "all" ? "active,done,archived,inbox,snoozed" : statusFilter,
    orderBy,
    order,
  });
  const items = data?.items || [];

  return (
    <div className="space-y-6 flex flex-col min-h-[calc(100vh-11rem)]">
      <div>
        <PageHeader
          title="All Items"
          subtitle="The full stream of your digital brain — every task, note, journal, habit, and idea across all 11 life categories."
          icon="Layers"
          color="#71717a"
          actions={
            <Button onClick={() => openItemEditor()} className="gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white">
              <Icon name="Plus" className="h-4 w-4" /> New item
            </Button>
          }
        />

        {/* Filters */}
        <div className="mt-4 space-y-3">
          <div className="relative">
            <Icon name="Search" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search title or content…" className="pl-9" />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex gap-1 rounded-lg bg-muted p-1">
              {[
                { key: "all", label: "All Items" },
                { key: "active", label: "Active" },
                { key: "inbox", label: "Inbox" },
                { key: "done", label: "Done" },
                { key: "archived", label: "Archived" },
              ].map((s) => (
                <button
                  key={s.key}
                  onClick={() => setStatusFilter(s.key)}
                  className={cn(
                    "rounded-md px-2.5 py-1 text-xs font-medium capitalize transition-all",
                    statusFilter === s.key ? "bg-background shadow-xs text-foreground font-semibold" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {s.label}
                </button>
              ))}
            </div>
            <Select value={sort} onValueChange={setSort}>
              <SelectTrigger className="h-9 w-[170px]" aria-label="Sort items">
                <Icon name="ArrowUpDown" className="h-3.5 w-3.5 text-muted-foreground" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent align="end">
                <SelectItem value="updatedAt:desc">Recently updated</SelectItem>
                <SelectItem value="createdAt:desc">Recently created</SelectItem>
                <SelectItem value="dueDate:asc">Due date</SelectItem>
                <SelectItem value="title:asc">Title A–Z</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => setTypeFilter(null)}
              className={cn("rounded-full px-2.5 py-1 text-xs font-medium transition-all", !typeFilter ? "bg-primary text-primary-foreground font-semibold" : "bg-muted text-muted-foreground hover:bg-muted/70")}
            >
              All types
            </button>
            {ITEM_TYPES.map((t) => {
              const on = typeFilter === t.type;
              return (
                <button
                  key={t.type}
                  onClick={() => setTypeFilter(t.type)}
                  className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium transition-all", on ? "text-white font-semibold" : "bg-muted text-muted-foreground hover:bg-muted/70")}
                  style={on ? { background: t.color } : {}}
                >
                  <Icon name={t.icon} className="h-3 w-3" />
                  {t.name}
                </button>
              );
            })}
          </div>
        </div>

        {/* Content stream */}
        <div className="mt-6">
          {isLoading ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-20 skeleton rounded-2xl bg-muted/40 animate-pulse border border-border/30" />
              ))}
            </div>
          ) : items.length === 0 ? (
            <EmptyState icon="Layers" title="No items match your filter" description="Try clearing your search query or capturing a new task, habit, or goal." />
          ) : (
            <>
              <div className="flex items-center justify-between mb-3 text-xs text-muted-foreground">
                <span className="font-medium">{items.length} item{items.length !== 1 ? "s" : ""} found</span>
                <span>Click any item for full details & connected notes</span>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {items.map((item) => (
                  <ItemCard key={item.id} item={item} showProject onClick={() => openItemDetail(item.id)} />
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* AI Life Coach Ecosystem Status Panel (Fills bottom area with rich contextual widgets) */}
      <div className="mt-auto pt-8">
        <div className="rounded-3xl border border-border/60 bg-gradient-to-br from-card/80 via-card/40 to-muted/20 p-5 shadow-xs backdrop-blur-md">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 text-white shadow-sm flex-shrink-0">
                <Icon name="Sparkles" className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-foreground leading-snug">AI Life Coach Intelligence Hub</h4>
                <p className="text-xs text-muted-foreground">Your items are interconnected with 6 AI Coaches and your private Document Vault.</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => openCoach("unified")}
                className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white px-3.5 py-2 text-xs font-semibold shadow-xs transition-colors flex items-center gap-1.5"
              >
                <Icon name="Brain" className="h-3.5 w-3.5" />
                <span>Consult AI Coach</span>
              </button>
              <button
                onClick={() => openVault()}
                className="rounded-xl border border-border/60 hover:bg-muted px-3.5 py-2 text-xs font-semibold text-foreground transition-colors flex items-center gap-1.5"
              >
                <Icon name="ShieldCheck" className="h-3.5 w-3.5 text-indigo-500" />
                <span>Open Vault</span>
              </button>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-4 border-t border-border/40 text-xs">
            <div className="rounded-xl border border-border/40 bg-background/50 p-2.5">
              <span className="text-[10px] text-muted-foreground uppercase font-semibold">Active Categories</span>
              <p className="text-base font-bold text-foreground mt-0.5">11 / 11</p>
            </div>
            <div className="rounded-xl border border-border/40 bg-background/50 p-2.5">
              <span className="text-[10px] text-muted-foreground uppercase font-semibold">Vault Documents</span>
              <p className="text-base font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">6 Indexed</p>
            </div>
            <div className="rounded-xl border border-border/40 bg-background/50 p-2.5">
              <span className="text-[10px] text-muted-foreground uppercase font-semibold">Predictive Alerts</span>
              <p className="text-base font-bold text-amber-600 dark:text-amber-400 mt-0.5">4 Active</p>
            </div>
            <div className="rounded-xl border border-border/40 bg-background/50 p-2.5">
              <span className="text-[10px] text-muted-foreground uppercase font-semibold">Coaches Online</span>
              <p className="text-base font-bold text-indigo-600 dark:text-indigo-400 mt-0.5">6 Available</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
