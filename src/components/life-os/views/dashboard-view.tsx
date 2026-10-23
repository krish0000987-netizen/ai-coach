"use client";

import { useState, useEffect } from "react";
import { useLifeOS } from "@/store/life-os";
import { useStats, useItems, useProjects, useReviews } from "@/lib/hooks";
import { Icon } from "../icon";
import { PageHeader, SectionCard, StatPill, EmptyState } from "../layout";
import { ItemCard } from "../item-card";
import { MoodCheckIn } from "../mood-check-in";
import { OnThisDay } from "../on-this-day";
import { FollowUpDue } from "../follow-up-due";
import { ReadingTracker } from "../reading-tracker";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { DOMAINS, AI_COACHES } from "@/lib/constants";
import { motion } from "framer-motion";

export function DashboardView() {
  const { setView, openItemDetail, openProject, openItemEditor, setQuickCaptureOpen, openCoach, openVault } = useLifeOS();
  const { data: stats, isLoading } = useStats();
  const { data: todayData, isLoading: tasksLoading } = useItems({ type: "task", status: "active" });
  const { data: projData, isLoading: projectsLoading } = useProjects();
  const { data: reviewData, isLoading: reviewsLoading } = useReviews();

  const [reminders, setReminders] = useState<any[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);

  useEffect(() => {
    fetch("/api/reminders")
      .then((r) => r.json())
      .then((d) => setReminders(d.dueSoon || d.all?.slice(0, 3) || []))
      .catch(() => {});

    fetch("/api/documents?expiring=true")
      .then((r) => r.json())
      .then((d) => setDocuments(d.documents || []))
      .catch(() => {});
  }, []);

  const [greeting, setGreeting] = useState("Good day");
  const today = new Date();

  useEffect(() => {
    const hours = new Date().getHours();
    setGreeting(hours < 12 ? "Good morning" : hours < 18 ? "Good afternoon" : "Good evening");
  }, []);

  const tasks = todayData?.items || [];
  const tasksToday = tasks.filter((t) => {
    if (!t.dueDate) return false;
    const d = new Date(t.dueDate);
    return d.toDateString() === today.toDateString();
  });
  const overdue = tasks.filter((t) => t.dueDate && new Date(t.dueDate) < today && t.status !== "done");
  const upcoming = tasks
    .filter((t) => t.dueDate && new Date(t.dueDate) > today)
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
    .slice(0, 5);

  const projects = (projData?.projects || []).filter((p) => p.status === "active").slice(0, 4);
  const lastReview = reviewData?.reviews?.[0];
  const reviewAge = lastReview ? Math.floor((today.getTime() - new Date(lastReview.date).getTime()) / 86400000) : 999;

  return (
    <div className="space-y-6">
      {/* Hero Greeting & AI Daily Briefing Banner */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl border border-border/60 bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-transparent p-6 sm:p-7 shadow-xs"
      >
        <div className="relative z-10 flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                <Icon name="Sparkles" className="h-3.5 w-3.5" />
              </span>
              <p className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                AI Life Coach · Daily Briefing
              </p>
            </div>
            <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl text-foreground">
              {greeting}!{" "}
              {tasksToday.length > 0
                ? `You have ${tasksToday.length} priority task${tasksToday.length > 1 ? "s" : ""} scheduled today.`
                : overdue.length > 0
                ? `${overdue.length} item${overdue.length > 1 ? "s" : ""} need attention.`
                : "Your life records and routine are clear and up to date."}
            </h1>
            <p className="mt-2 max-w-2xl text-xs text-muted-foreground sm:text-sm">
              {today.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })} ·
              Your digital brain is tracking all 11 life areas, document vault expiries, and daily habit consistency.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 flex-shrink-0">
            <button
              onClick={() => openCoach("unified")}
              className="inline-flex items-center gap-2 rounded-xl bg-foreground px-4 py-2.5 text-xs font-semibold text-background shadow-xs transition-opacity hover:opacity-90"
            >
              <Icon name="Brain" className="h-4 w-4 text-emerald-500" />
              Open AI Life Coach
            </button>
            <button
              onClick={() => openVault()}
              className="inline-flex items-center gap-2 rounded-xl border border-border/80 bg-background/80 px-4 py-2.5 text-xs font-semibold text-foreground hover:bg-muted"
            >
              <Icon name="Upload" className="h-4 w-4" />
              Upload Document
            </button>
          </div>
        </div>

        <div className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 right-24 h-40 w-40 rounded-full bg-teal-500/10 blur-3xl" />
      </motion.div>

      {/* 6 Specialized AI Coaches Shortcut Ribbon */}
      <div className="rounded-2xl border border-border/60 bg-card/60 p-3 shadow-xs backdrop-blur-sm">
        <div className="mb-2 flex items-center justify-between px-1">
          <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground">
            <Icon name="Sparkles" className="h-3.5 w-3.5 text-indigo-500" />
            Specialized AI Coaches
          </div>
          <button
            onClick={() => openCoach("unified")}
            className="text-xs font-medium text-indigo-600 hover:underline"
          >
            Unified Chat →
          </button>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
          {AI_COACHES.filter((c) => c.type !== "unified").map((c) => (
            <button
              key={c.type}
              onClick={() => openCoach(c.type)}
              className="group flex items-center gap-2.5 rounded-xl border border-border/40 bg-background/60 p-2.5 text-left transition-all hover:border-indigo-500/40 hover:bg-card hover:shadow-xs"
            >
              <span
                className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg text-white shadow-xs"
                style={{ background: c.color }}
              >
                <Icon name={c.icon} className="h-3.5 w-3.5" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="truncate text-xs font-bold text-foreground group-hover:text-indigo-600">
                  {c.name.replace(" Coach", "")}
                </div>
                <div className="truncate text-[10px] text-muted-foreground">AI Guided</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Stat Pills */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <button onClick={() => setView("vault")} className="text-left">
          <StatPill label="Document Vault" value={documents.length > 0 ? `${documents.length} Expiring` : "Protected"} color="#6366f1" icon="ShieldCheck" />
        </button>
        <button onClick={() => setView("reminders")} className="text-left">
          <StatPill label="Active Alerts" value={reminders.length || 0} color="#f59e0b" icon="BellRing" />
        </button>
        <button onClick={() => setView("timeline")} className="text-left">
          <StatPill label="Life Milestones" value="Timeline" color="#3b82f6" icon="Milestone" />
        </button>
        <button onClick={() => setView("family")} className="text-left">
          <StatPill label="Family Circle" value="Shared" color="#ec4899" icon="Users" />
        </button>
      </div>

      {/* Main Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Column */}
        <div className="space-y-6 lg:col-span-2">
          {/* Predictive Expiry & Document Vault Widget */}
          {documents.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4.5 shadow-xs"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/20 text-amber-600">
                    <Icon name="AlertTriangle" className="h-4 w-4" />
                  </span>
                  <div>
                    <h3 className="text-sm font-bold text-foreground">Document Expiry Alerts Detected</h3>
                    <p className="text-xs text-muted-foreground">
                      {documents.length} document{documents.length > 1 ? "s" : ""} require renewal in the next 90 days.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => openVault()}
                  className="rounded-xl bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-700"
                >
                  Review Vault
                </button>
              </div>

              <div className="mt-3 divide-y divide-border/40">
                {documents.slice(0, 2).map((doc) => (
                  <div key={doc.id} className="flex items-center justify-between py-2 text-xs">
                    <span className="font-medium text-foreground">{doc.title}</span>
                    <span className="text-amber-600 font-semibold">
                      Expires: {doc.expiryDate ? new Date(doc.expiryDate).toLocaleDateString() : ""}
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Today's Focus */}
          <SectionCard
            title="Today's Focus & Agenda"
            icon="Target"
            action={
              <Button variant="ghost" size="sm" onClick={() => openItemEditor({ type: "task" })}>
                <Icon name="Plus" className="mr-1 h-3.5 w-3.5" /> Add Task
              </Button>
            }
          >
            {tasksToday.length === 0 && overdue.length === 0 && upcoming.length === 0 ? (
              <EmptyState
                icon="Coffee"
                title="Nothing scheduled today"
                description="Your day is clear. Capture a quick idea or ask your Life Coach for daily focus."
                action={{ label: "Quick Capture", onClick: () => setQuickCaptureOpen(true) }}
              />
            ) : (
              <div className="space-y-4">
                {overdue.length > 0 && (
                  <div>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-rose-500">Overdue Items</p>
                    <div className="space-y-2">
                      {overdue.slice(0, 3).map((t) => (
                        <ItemCard key={t.id} item={t} showProject onClick={() => openItemDetail(t.id)} />
                      ))}
                    </div>
                  </div>
                )}

                {tasksToday.length > 0 && (
                  <div>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-amber-500">Scheduled for Today</p>
                    <div className="space-y-2">
                      {tasksToday.map((t) => (
                        <ItemCard key={t.id} item={t} showProject onClick={() => openItemDetail(t.id)} />
                      ))}
                    </div>
                  </div>
                )}

                {upcoming.length > 0 && (
                  <div>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Coming Up Soon</p>
                    <div className="space-y-2">
                      {upcoming.slice(0, 3).map((t) => (
                        <ItemCard key={t.id} item={t} showProject onClick={() => openItemDetail(t.id)} />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </SectionCard>

          {/* 11 Life Categories Navigator */}
          <SectionCard title="11 Life Categories" icon="Compass">
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
              {DOMAINS.map((dom) => (
                <button
                  key={dom.key}
                  onClick={() => setView(dom.key as any)}
                  className="group flex items-center gap-2.5 rounded-xl border border-border/40 bg-card p-3 text-left transition-all hover:border-border hover:shadow-xs"
                >
                  <span
                    className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg"
                    style={{ background: `${dom.color}15`, color: dom.color }}
                  >
                    <Icon name={dom.icon} className="h-3.5 w-3.5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-xs font-semibold text-foreground group-hover:text-indigo-600">
                      {dom.short}
                    </div>
                    <div className="truncate text-[10px] text-muted-foreground">Area #{dom.categoryNumber}</div>
                  </div>
                </button>
              ))}
            </div>
          </SectionCard>

          {/* Active Projects */}
          <SectionCard
            title="Active Life Threads & Projects"
            icon="FolderKanban"
            action={<Button variant="ghost" size="sm" onClick={() => setView("projects")}>View all</Button>}
          >
            {projects.length === 0 ? (
              <EmptyState icon="FolderPlus" title="No active projects" description="Create a thread to unify related tasks, records, and milestones." />
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {projects.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => openProject(p.id)}
                    className="group rounded-xl border border-border/60 p-4 text-left transition-all hover:border-border hover:shadow-xs"
                  >
                    <div className="flex items-center gap-2">
                      <span className="h-3 w-3 rounded-full" style={{ background: p.color }} />
                      <span className="flex-1 truncate text-sm font-semibold">{p.name}</span>
                      <Icon name="ArrowUpRight" className="h-3.5 w-3.5 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                    </div>
                    <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">{p.description || "No description"}</p>
                    <div className="mt-3">
                      <div className="mb-1 flex items-center justify-between text-[11px] text-muted-foreground">
                        <span>{p.progress}% completed</span>
                      </div>
                      <Progress value={p.progress} className="h-1.5" />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </SectionCard>
        </div>

        {/* Right Sidebar Widgets */}
        <div className="space-y-4">
          {/* Mood Check-in */}
          <MoodCheckIn />

          {/* Weekly Reflection Prompt */}
          <SectionCard title="Reflection" icon="NotebookPen" className="bg-gradient-to-br from-violet-500/10 to-fuchsia-500/5">
            {reviewAge > 1 ? (
              <div>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  {reviewAge > 7
                    ? "It's been a while since your last reflection. Close the loop on your week with your Life Coach."
                    : `Your last reflection was logged ${reviewAge} days ago.`}
                </p>
                <Button size="sm" className="mt-3 w-full" onClick={() => setView("reviews")}>
                  <Icon name="NotebookPen" className="mr-1 h-3.5 w-3.5" /> Start Reflection
                </Button>
              </div>
            ) : (
              <div>
                <p className="text-xs text-foreground font-medium">You reflected {reviewAge === 0 ? "today" : "yesterday"}.</p>
                {lastReview?.wins && (
                  <p className="mt-2 rounded-lg bg-background/60 p-2 text-xs italic text-muted-foreground">
                    “{lastReview.wins}”
                  </p>
                )}
              </div>
            )}
          </SectionCard>

          {/* Follow-up Reminders */}
          <FollowUpDue />

          {/* On this Day */}
          <OnThisDay />

          {/* Reading Tracker */}
          <ReadingTracker />
        </div>
      </div>
    </div>
  );
}
