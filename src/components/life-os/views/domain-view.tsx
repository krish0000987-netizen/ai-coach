"use client";

import { useLifeOS } from "@/store/life-os";
import { useItems, useDomains } from "@/lib/hooks";
import { Icon } from "../icon";
import { PageHeader, SectionCard, EmptyState } from "../layout";
import { ItemCard } from "../item-card";
import { Button } from "@/components/ui/button";
import { DOMAINS, DOMAIN_MAP, ITEM_TYPE_MAP } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { useState } from "react";
import { FollowUpDue } from "../follow-up-due";
import { ReadingTracker } from "../reading-tracker";
import { HealthOverview } from "../health-overview";
import { SubscriptionsOverview } from "../subscriptions-overview";
import { IdeaVault } from "../idea-vault";
import { BucketList } from "../bucket-list";
import { AdminQuickActions } from "../admin-quick-actions";
import { TimeActionOverview } from "../time-action-overview";

export function DomainView({ domainKey }: { domainKey: string }) {
  const { openItemDetail, openItemEditor, openCoach, openVault } = useLifeOS();
  const { data: domData } = useDomains();
  const domainMeta = DOMAIN_MAP[domainKey] || DOMAINS[0];
  const domainRecord = domData?.domains?.find((d: any) => d.key === domainKey || d.key === domainMeta.key);
  const [typeFilter, setTypeFilter] = useState<string | null>(null);

  const { data, isLoading } = useItems({ domain: domainRecord?.id || domainKey, status: "active,done" });
  const items = data?.items || [];

  // group by type
  const byType: Record<string, any[]> = {};
  for (const it of items) (byType[it.type] ||= []).push(it);
  const types = Object.keys(byType).sort((a, b) => byType[b].length - byType[a].length);

  const filteredItems = typeFilter ? byType[typeFilter] || [] : items;

  // Domain-specific quick-add types for all 11 categories
  const quickTypes: Record<string, string[]> = {
    health_wellness: ["symptom", "medication", "habit", "event", "milestone"],
    health: ["symptom", "medication", "habit", "event", "milestone"],
    financial_money: ["finance", "goal", "task", "note"],
    wealth: ["finance", "goal", "task", "note"],
    education_learning: ["bookmark", "goal", "milestone", "note"],
    growth: ["bookmark", "goal", "milestone", "note"],
    career_work: ["task", "milestone", "goal", "note"],
    legal_government: ["task", "document", "milestone", "note"],
    admin: ["task", "document", "note"],
    family_relationships: ["contact", "event", "milestone", "note"],
    network: ["contact", "event", "milestone", "note"],
    property_assets: ["task", "document", "finance", "note"],
    travel_experiences: ["event", "idea", "bookmark", "note"],
    creativity: ["idea", "bookmark", "event", "milestone"],
    hobbies_skills: ["idea", "habit", "milestone", "note"],
    insurance_protection: ["finance", "task", "document", "note"],
    daily_personal: ["journal", "habit", "routine", "affirmation", "vision"],
    mind_soul: ["journal", "affirmation", "vision", "habit"],
    time_action: ["task", "habit", "routine", "goal"],
  };

  const qtypes = quickTypes[domainKey] || ["task", "note", "goal"];

  return (
    <div className="space-y-6" aria-busy={isLoading}>
      <PageHeader
        title={domainMeta.name}
        subtitle={domainMeta.description}
        icon={domainMeta.icon}
        color={domainMeta.color}
        actions={
          <div className="flex flex-wrap gap-1.5">
            {/* Direct AI Coach shortcut for this category */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => openCoach(domainMeta.coachType || "unified")}
              className="gap-1.5 border-indigo-500/40 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/40"
            >
              <Icon name="Sparkles" className="h-3.5 w-3.5" />
              <span>Ask {domainMeta.short} Coach</span>
            </Button>

            {/* Direct Vault shortcut */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => openVault(domainMeta.key)}
              className="gap-1.5"
            >
              <Icon name="FolderArchive" className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Vault Records</span>
            </Button>

            {qtypes.slice(0, 3).map((t) => {
              const m = ITEM_TYPE_MAP[t];
              if (!m) return null;
              return (
                <Button
                  key={t}
                  variant="outline"
                  size="sm"
                  onClick={() => openItemEditor({ type: t, domainId: domainRecord?.id })}
                  className="gap-1.5"
                >
                  <Icon name={m.icon} className="h-3.5 w-3.5" style={{ color: m.color }} />
                  <span className="hidden sm:inline">{m.name}</span>
                </Button>
              );
            })}
          </div>
        }
      />

      {/* Hero domain card */}
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl border border-border/60 p-6"
        style={{ background: `linear-gradient(135deg, ${domainMeta.color}15, transparent 70%)` }}
      >
        <div
          className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full opacity-20 blur-3xl"
          style={{ background: domainMeta.color }}
        />
        <div className="relative grid gap-4 sm:grid-cols-4">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="h-7 w-12 rounded bg-muted/40 animate-pulse" />
                <div className="h-3 w-16 rounded bg-muted/30 animate-pulse" />
              </div>
            ))
          ) : (
            <>
              <Stat label="Total items" value={items.length} />
              <Stat label="Done / Verified" value={items.filter((i) => i.status === "done").length} />
              <Stat label="Active" value={items.filter((i) => i.status === "active").length} />
              <Stat label="Record Types" value={types.length} />
            </>
          )}
        </div>
      </motion.div>

      {/* Domain-specific widgets */}
      {(domainKey === "health_wellness" || domainKey === "health") && <HealthOverview />}
      {(domainKey === "financial_money" || domainKey === "wealth") && <SubscriptionsOverview />}
      {(domainKey === "family_relationships" || domainKey === "network") && <FollowUpDue />}
      {(domainKey === "education_learning" || domainKey === "growth") && <ReadingTracker />}
      {(domainKey === "hobbies_skills" || domainKey === "creativity") && (
        <div className="grid gap-6 lg:grid-cols-2">
          <IdeaVault />
          <BucketList />
        </div>
      )}
      {(domainKey === "legal_government" || domainKey === "admin") && <AdminQuickActions />}
      {domainKey === "time_action" && <TimeActionOverview />}

      {/* Type filter chips */}
      {types.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => setTypeFilter(null)}
            className={cn(
              "rounded-full px-3 py-1 text-xs font-medium transition-all",
              !typeFilter ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/70"
            )}
          >
            All ({items.length})
          </button>
          {types.map((t) => {
            const m = ITEM_TYPE_MAP[t] || { name: t, color: "#71717a", icon: "Circle" };
            return (
              <button
                key={t}
                onClick={() => setTypeFilter(t)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-all",
                  typeFilter === t ? "text-white" : "bg-muted text-muted-foreground hover:bg-muted/70"
                )}
                style={typeFilter === t ? { background: m.color } : {}}
              >
                <Icon name={m.icon} className="h-3 w-3" />
                {m.name} ({byType[t].length})
              </button>
            );
          })}
        </div>
      )}

      {/* Items List */}
      {isLoading ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-20 rounded-xl bg-muted/40 animate-pulse" />
          ))}
        </div>
      ) : filteredItems.length === 0 ? (
        <EmptyState
          icon={domainMeta.icon}
          title={`Nothing in ${domainMeta.short} yet`}
          description={`Start capturing ${domainMeta.name.toLowerCase()} records, tasks, or documents.`}
          action={{
            label: "Add item",
            onClick: () => openItemEditor({ type: qtypes[0], domainId: domainRecord?.id }),
          }}
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {filteredItems.map((item) => (
            <ItemCard key={item.id} item={item} showProject onClick={() => openItemDetail(item.id)} />
          ))}
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}
