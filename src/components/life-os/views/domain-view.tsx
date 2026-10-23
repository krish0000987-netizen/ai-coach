"use client";

import { useLifeOS } from "@/store/life-os";
import { useItems, useDomains } from "@/lib/hooks";
import { Icon } from "../icon";
import { PageHeader, SectionCard, EmptyState } from "../layout";
import { ItemCard } from "../item-card";
import { Button } from "@/components/ui/button";
import { DOMAINS, DOMAIN_MAP, ITEM_TYPE_MAP, AI_COACH_MAP } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
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
  const [quickInput, setQuickInput] = useState("");

  // Category Vault Documents state
  const [vaultDocs, setVaultDocs] = useState<any[]>([]);
  const [docsLoading, setDocsLoading] = useState(true);

  // Fetch category documents from vault
  useEffect(() => {
    let isMounted = true;
    setDocsLoading(true);
    fetch(`/api/documents?category=${domainMeta.key}`)
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => {
        if (isMounted) {
          const docs = Array.isArray(data) ? data : data?.documents || [];
          setVaultDocs(Array.isArray(docs) ? docs : []);
          setDocsLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) setDocsLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, [domainMeta.key]);

  const { data, isLoading } = useItems({ domain: domainRecord?.id || domainKey, status: "active,done" });
  const items = data?.items || [];

  // Dedicated AI Coach for this category
  const coachType = domainMeta.coachType || domainMeta.key;
  const coach = AI_COACH_MAP[coachType] || AI_COACH_MAP[domainMeta.key] || AI_COACH_MAP.unified;

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

  const handleAskCoachSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickInput.trim()) {
      openCoach(coachType);
      return;
    }
    const q = quickInput;
    setQuickInput("");
    openCoach(coachType, q);
  };

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
              onClick={() => openCoach(coachType)}
              className="gap-1.5 border-indigo-500/40 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 font-semibold"
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
              <span className="hidden sm:inline">Vault ({vaultDocs.length})</span>
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
        <div className="relative grid gap-4 grid-cols-2 sm:grid-cols-4">
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
              <Stat label="Vault Documents" value={vaultDocs.length} />
            </>
          )}
        </div>
      </motion.div>

      {/* ─── DEDICATED CATEGORY AI COACH HUB ─────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl border border-indigo-500/30 bg-gradient-to-br from-card/90 via-card/60 to-indigo-500/5 p-5 sm:p-6 shadow-sm backdrop-blur-md"
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border/40 pb-4">
          <div className="flex items-center gap-3.5">
            <div
              className="flex h-12 w-12 items-center justify-center rounded-2xl text-white shadow-md flex-shrink-0"
              style={{ background: coach.color }}
            >
              <Icon name={coach.icon} className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-foreground">{coach.name}</h3>
                <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Live Coach
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5 leading-snug">
                {coach.tagline}
              </p>
            </div>
          </div>

          <Button
            size="sm"
            onClick={() => openCoach(coachType)}
            className="gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs"
          >
            <Icon name="MessagesSquare" className="h-3.5 w-3.5" />
            <span>Open Coach Studio</span>
          </Button>
        </div>

        {/* Quick Question Bar */}
        <form onSubmit={handleAskCoachSubmit} className="mt-4 flex gap-2">
          <div className="relative flex-1">
            <Icon
              name="Search"
              className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none"
            />
            <input
              type="text"
              value={quickInput}
              onChange={(e) => setQuickInput(e.target.value)}
              placeholder={`Ask your ${domainMeta.short} Coach anything about your records, plans, or goals...`}
              className="w-full rounded-2xl border border-border/70 bg-background/80 pl-10 pr-4 py-2.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500/40 shadow-xs"
            />
          </div>
          <Button
            type="submit"
            size="sm"
            className="rounded-2xl px-4 gap-1.5 bg-foreground text-background hover:bg-foreground/90 text-xs font-semibold"
          >
            <Icon name="Sparkles" className="h-3.5 w-3.5" />
            <span>Ask Coach</span>
          </Button>
        </form>

        {/* Interactive Coach Suggested Prompts */}
        <div className="mt-4 space-y-1.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            Recommended Questions for {coach.name}
          </span>
          <div className="flex flex-wrap gap-2 pt-1">
            {coach.suggestedQuestions.map((q, idx) => (
              <button
                key={idx}
                onClick={() => openCoach(coachType, q)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-border/60 bg-background/60 hover:border-indigo-500/40 hover:bg-indigo-500/5 px-3 py-1.5 text-xs text-foreground transition-all leading-snug group text-left"
              >
                <span className="text-muted-foreground group-hover:text-indigo-500 transition-colors">💡</span>
                <span>{q}</span>
              </button>
            ))}
          </div>
        </div>
      </motion.div>

      {/* ─── CATEGORY DOCUMENT VAULT SECTION ─────────────────────────────────── */}
      <div className="rounded-3xl border border-border/60 bg-card/40 p-5 backdrop-blur-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon name="FolderArchive" className="h-4 w-4 text-indigo-500" />
            <h4 className="font-semibold text-sm text-foreground">
              {domainMeta.short} Vault Records ({vaultDocs.length})
            </h4>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => openVault(domainMeta.key)}
            className="text-xs text-indigo-600 dark:text-indigo-400 gap-1 hover:bg-indigo-50 dark:hover:bg-indigo-950/40"
          >
            <span>Open Vault</span>
            <Icon name="ArrowRight" className="h-3 w-3" />
          </Button>
        </div>

        {docsLoading ? (
          <div className="grid gap-2 sm:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 rounded-xl bg-muted/40 animate-pulse" />
            ))}
          </div>
        ) : vaultDocs.length === 0 ? (
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-2xl border border-dashed border-border/80 bg-muted/20 p-4">
            <div className="text-xs text-muted-foreground">
              No documents uploaded in <span className="font-medium text-foreground">{domainMeta.name}</span> yet. Upload your records to enable deep AI coaching synthesis.
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => openVault(domainMeta.key)}
              className="gap-1.5 text-xs whitespace-nowrap"
            >
              <Icon name="Upload" className="h-3 w-3" />
              <span>Upload Document</span>
            </Button>
          </div>
        ) : (
          <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
            {vaultDocs.slice(0, 6).map((doc) => {
              const isExpired = doc.expiryDate && new Date(doc.expiryDate) < new Date();
              const isExpiringSoon =
                doc.expiryDate &&
                !isExpired &&
                new Date(doc.expiryDate).getTime() - Date.now() < 90 * 24 * 60 * 60 * 1000;

              return (
                <div
                  key={doc.id}
                  onClick={() => openVault(domainMeta.key)}
                  className="cursor-pointer rounded-2xl border border-border/50 bg-background/70 hover:border-indigo-500/40 p-3 text-xs transition-all flex items-center justify-between gap-2 shadow-2xs"
                >
                  <div className="min-w-0">
                    <p className="font-semibold text-foreground truncate">{doc.title}</p>
                    <p className="text-[11px] text-muted-foreground truncate">{doc.documentType}</p>
                  </div>
                  {doc.expiryDate && (
                    <span
                      className={cn(
                        "rounded-md px-1.5 py-0.5 text-[10px] font-medium whitespace-nowrap",
                        isExpired
                          ? "bg-rose-500/10 text-rose-600"
                          : isExpiringSoon
                          ? "bg-amber-500/10 text-amber-600"
                          : "bg-muted text-muted-foreground"
                      )}
                    >
                      {isExpired ? "Expired" : isExpiringSoon ? "Expiring" : "Valid"}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ─── SPECIALIZED DOMAIN WIDGETS ─────────────────────────────────────── */}
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
      {(domainKey === "daily_personal" || domainKey === "mind_soul" || domainKey === "time_action") && (
        <TimeActionOverview />
      )}

      {/* Specialized widgets for Career, Property, Travel, Insurance */}
      {domainKey === "career_work" && (
        <div className="rounded-3xl border border-border/60 bg-card/40 p-5 backdrop-blur-sm space-y-3">
          <div className="flex items-center gap-2">
            <Icon name="Briefcase" className="h-4 w-4 text-purple-500" />
            <h4 className="font-semibold text-sm text-foreground">Career & Professional Milestones</h4>
          </div>
          <p className="text-xs text-muted-foreground">
            Track promotions, high-impact achievements, and resume bullet points quantified using STAR metrics.
          </p>
          <div className="grid gap-3 sm:grid-cols-3 pt-1">
            <div className="rounded-2xl border border-border/50 bg-background/60 p-3 text-xs">
              <span className="text-[10px] font-bold uppercase text-muted-foreground">Active Goal</span>
              <p className="font-semibold text-foreground mt-1">Promotion / Senior Role Roadmap</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">Review quarterly performance milestones</p>
            </div>
            <div className="rounded-2xl border border-border/50 bg-background/60 p-3 text-xs">
              <span className="text-[10px] font-bold uppercase text-muted-foreground">Resume Status</span>
              <p className="font-semibold text-foreground mt-1">STAR Quantified Impact</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">Verified bullet points logged</p>
            </div>
            <div className="rounded-2xl border border-border/50 bg-background/60 p-3 text-xs">
              <span className="text-[10px] font-bold uppercase text-muted-foreground">AI Strategy</span>
              <button
                onClick={() => openCoach("career_work", "Help me rewrite my resume bullets with STAR metrics")}
                className="font-semibold text-indigo-600 hover:underline mt-1 text-left block"
              >
                Mock Interview & CV Polish →
              </button>
            </div>
          </div>
        </div>
      )}

      {domainKey === "property_assets" && (
        <div className="rounded-3xl border border-border/60 bg-card/40 p-5 backdrop-blur-sm space-y-3">
          <div className="flex items-center gap-2">
            <Icon name="Home" className="h-4 w-4 text-amber-500" />
            <h4 className="font-semibold text-sm text-foreground">Property & Asset Safeguards</h4>
          </div>
          <p className="text-xs text-muted-foreground">
            Monitor real estate deeds, vehicle registrations, home seasonal checklists, and warranty expirations.
          </p>
          <div className="grid gap-3 sm:grid-cols-3 pt-1">
            <div className="rounded-2xl border border-border/50 bg-background/60 p-3 text-xs">
              <span className="text-[10px] font-bold uppercase text-muted-foreground">Home & Vehicle</span>
              <p className="font-semibold text-foreground mt-1">Seasonal Maintenance</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">HVAC, vehicle fluids & filter check</p>
            </div>
            <div className="rounded-2xl border border-border/50 bg-background/60 p-3 text-xs">
              <span className="text-[10px] font-bold uppercase text-muted-foreground">Warranty Radar</span>
              <p className="font-semibold text-foreground mt-1">Asset Deeds & Receipts</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">Indexed in Document Vault</p>
            </div>
            <div className="rounded-2xl border border-border/50 bg-background/60 p-3 text-xs">
              <span className="text-[10px] font-bold uppercase text-muted-foreground">AI Coach Action</span>
              <button
                onClick={() => openCoach("property_assets", "Generate a seasonal maintenance checklist for my property and vehicle")}
                className="font-semibold text-indigo-600 hover:underline mt-1 text-left block"
              >
                Run Maintenance Checklist →
              </button>
            </div>
          </div>
        </div>
      )}

      {domainKey === "travel_experiences" && (
        <div className="rounded-3xl border border-border/60 bg-card/40 p-5 backdrop-blur-sm space-y-3">
          <div className="flex items-center gap-2">
            <Icon name="Plane" className="h-4 w-4 text-cyan-500" />
            <h4 className="font-semibold text-sm text-foreground">Travel Logistics & Expedition Radar</h4>
          </div>
          <p className="text-xs text-muted-foreground">
            Track passport validity, visa entry criteria, itineraries, and essential trip packing protocols.
          </p>
          <div className="grid gap-3 sm:grid-cols-3 pt-1">
            <div className="rounded-2xl border border-border/50 bg-background/60 p-3 text-xs">
              <span className="text-[10px] font-bold uppercase text-muted-foreground">Passport Horizon</span>
              <p className="font-semibold text-foreground mt-1">6-Month Validity Rule</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">International entry compliance</p>
            </div>
            <div className="rounded-2xl border border-border/50 bg-background/60 p-3 text-xs">
              <span className="text-[10px] font-bold uppercase text-muted-foreground">Active Itineraries</span>
              <p className="font-semibold text-foreground mt-1">Bookings & Tickets</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">Keep offline copies in vault</p>
            </div>
            <div className="rounded-2xl border border-border/50 bg-background/60 p-3 text-xs">
              <span className="text-[10px] font-bold uppercase text-muted-foreground">AI Travel Coach</span>
              <button
                onClick={() => openCoach("travel_experiences", "Help me build an international travel packing checklist and check visa requirements")}
                className="font-semibold text-indigo-600 hover:underline mt-1 text-left block"
              >
                Plan Next Expedition →
              </button>
            </div>
          </div>
        </div>
      )}

      {domainKey === "insurance_protection" && (
        <div className="rounded-3xl border border-border/60 bg-card/40 p-5 backdrop-blur-sm space-y-3">
          <div className="flex items-center gap-2">
            <Icon name="ShieldCheck" className="h-4 w-4 text-teal-500" />
            <h4 className="font-semibold text-sm text-foreground">Insurance & Policy Coverage Matrix</h4>
          </div>
          <p className="text-xs text-muted-foreground">
            Review health, auto, home/renters, and life insurance policies, deductible strategies, and claim readiness.
          </p>
          <div className="grid gap-3 sm:grid-cols-3 pt-1">
            <div className="rounded-2xl border border-border/50 bg-background/60 p-3 text-xs">
              <span className="text-[10px] font-bold uppercase text-muted-foreground">Policies Active</span>
              <p className="font-semibold text-foreground mt-1">Comprehensive Coverage</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">Health, auto, and property</p>
            </div>
            <div className="rounded-2xl border border-border/50 bg-background/60 p-3 text-xs">
              <span className="text-[10px] font-bold uppercase text-muted-foreground">Renewal Strategy</span>
              <p className="font-semibold text-foreground mt-1">30-Day Market Check</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">Shop rates before annual renewal</p>
            </div>
            <div className="rounded-2xl border border-border/50 bg-background/60 p-3 text-xs">
              <span className="text-[10px] font-bold uppercase text-muted-foreground">AI Risk Audit</span>
              <button
                onClick={() => openCoach("insurance_protection", "Audit my insurance policies for coverage gaps and explain deductible trade-offs")}
                className="font-semibold text-indigo-600 hover:underline mt-1 text-left block"
              >
                Run Coverage Audit →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── TYPE FILTER CHIPS ───────────────────────────────────────────────── */}
      {types.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => setTypeFilter(null)}
            className={cn(
              "rounded-full px-3 py-1 text-xs font-medium transition-all",
              !typeFilter ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/70"
            )}
          >
            All Items ({items.length})
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

      {/* ─── ITEMS LIST ──────────────────────────────────────────────────────── */}
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
