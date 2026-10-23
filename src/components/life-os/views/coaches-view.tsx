"use client";

import { useState, useEffect, useRef } from "react";
import { useLifeOS } from "@/store/life-os";
import { AI_COACHES, AI_COACH_MAP, AICoachMeta, DOMAIN_MAP } from "@/lib/constants";
import { Icon } from "../icon";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";

interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  createdAt: string;
}

export function CoachesView() {
  const { activeCoachType, openCoach, setView } = useLifeOS();
  const [currentCoachType, setCurrentCoachType] = useState(activeCoachType || "unified");
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const currentCoach = AI_COACH_MAP[currentCoachType] || AI_COACH_MAP.unified;

  // Sync from store
  useEffect(() => {
    if (activeCoachType && activeCoachType !== currentCoachType) {
      setCurrentCoachType(activeCoachType);
    }
  }, [activeCoachType]);

  // Load conversation for current coach
  useEffect(() => {
    async function loadConversation() {
      try {
        const res = await fetch(`/api/coaches?coachType=${currentCoachType}`);
        if (res.ok) {
          const convs = await res.json();
          if (Array.isArray(convs) && convs.length > 0) {
            const latest = convs[0];
            setConversationId(latest.id);
            const detailRes = await fetch(`/api/coaches?conversationId=${latest.id}`);
            if (detailRes.ok) {
              const fullConv = await detailRes.json();
              setMessages(fullConv?.messages || []);
            }
          } else {
            setConversationId(null);
            setMessages([]);
          }
        }
      } catch (err) {
        console.error("Error loading coach conversation:", err);
      }
    }
    loadConversation();
  }, [currentCoachType]);

  // Scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Send message
  async function sendMessage(textToSend?: string) {
    const text = textToSend || input;
    if (!text.trim() || loading) return;

    const userMsg: Message = {
      id: "temp_" + Date.now(),
      role: "user",
      content: text,
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/coaches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          coachType: currentCoachType,
          message: text,
          conversationId,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to get AI coach reply");
      }

      if (data.conversationId && !conversationId) {
        setConversationId(data.conversationId);
      }

      if (data.message) {
        setMessages((prev) => [...prev, data.message]);
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to communicate with AI Coach");
    } finally {
      setLoading(false);
    }
  }

  // Clear conversation
  async function handleClearHistory() {
    if (!conversationId) {
      setMessages([]);
      return;
    }
    if (!confirm("Clear this coach's conversation history?")) return;

    try {
      await fetch(`/api/coaches?conversationId=${conversationId}`, { method: "DELETE" });
      setMessages([]);
      setConversationId(null);
      toast.success("Conversation cleared");
    } catch {
      toast.error("Failed to clear conversation");
    }
  }

  return (
    <div className="flex h-full flex-1 flex-col min-h-0 gap-3 sm:gap-4 overflow-hidden">
      {/* Top Coach Ribbon Selector */}
      <div className="flex items-center gap-2 overflow-x-auto rounded-2xl border border-border/60 bg-card/60 p-1.5 sm:p-2 shadow-xs backdrop-blur-sm flex-shrink-0">
        {AI_COACHES.map((coach) => {
          const isActive = currentCoachType === coach.type;
          return (
            <button
              key={coach.type}
              onClick={() => {
                setCurrentCoachType(coach.type);
                openCoach(coach.type);
              }}
              className={cn(
                "group flex items-center gap-2 rounded-xl px-3 py-1.5 sm:px-3.5 sm:py-2 text-xs font-semibold transition-all whitespace-nowrap",
                isActive
                  ? "bg-foreground text-background shadow-sm"
                  : "bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <span
                className="flex h-5 w-5 items-center justify-center rounded-md transition-transform group-hover:scale-105"
                style={{
                  background: isActive ? "#ffffff25" : `${coach.color}20`,
                  color: isActive ? "#ffffff" : coach.color,
                }}
              >
                <Icon name={coach.icon} className="h-3 w-3" />
              </span>
              <span>{coach.name.replace(" Coach", "")}</span>
            </button>
          );
        })}
      </div>

      {/* Main Studio Body: Left Intel Panel + Right Chat Workspace */}
      <div className="flex flex-1 min-h-0 gap-4 overflow-hidden">
        {/* Left Coach Intel Panel (Desktop) */}
        <aside className="hidden lg:flex w-80 flex-col gap-3.5 flex-shrink-0 min-h-0 overflow-y-auto pr-1">
          {/* Coach Persona Card */}
          <div className="rounded-2xl border border-border/60 bg-card/60 p-4 shadow-xs backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <div
                className="flex h-11 w-11 items-center justify-center rounded-2xl text-white shadow-sm flex-shrink-0"
                style={{ background: currentCoach.color }}
              >
                <Icon name={currentCoach.icon} className="h-6 w-6" />
              </div>
              <div className="min-w-0">
                <h3 className="font-bold text-sm leading-tight text-foreground truncate">{currentCoach.name}</h3>
                <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">{currentCoach.tagline}</p>
              </div>
            </div>

            {/* Domains Covered */}
            <div className="mt-3.5 pt-3 border-t border-border/40">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Connected Life Areas</span>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {currentCoach.categoryKeys.map((catKey) => {
                  const dom = DOMAIN_MAP[catKey];
                  return dom ? (
                    <span
                      key={catKey}
                      className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-medium border border-border/50 bg-background/60"
                    >
                      <span className="h-1.5 w-1.5 rounded-full" style={{ background: dom.color }} />
                      {dom.short}
                    </span>
                  ) : null;
                })}
              </div>
            </div>
          </div>

          {/* Grounded Records Status */}
          <div className="rounded-2xl border border-border/60 bg-card/40 p-3.5 text-xs shadow-xs backdrop-blur-sm space-y-2">
            <div className="flex items-center gap-2 text-foreground font-semibold text-[11px] uppercase tracking-wider">
              <Icon name="Database" className="h-3.5 w-3.5 text-indigo-500" />
              <span>Grounded Knowledge Base</span>
            </div>
            <div className="space-y-1.5 text-[11px] text-muted-foreground">
              <div className="flex items-center gap-2">
                <Icon name="CheckCircle2" className="h-3.5 w-3.5 text-emerald-500 flex-shrink-0" />
                <span>6 Documents in Secure Vault</span>
              </div>
              <div className="flex items-center gap-2">
                <Icon name="CheckCircle2" className="h-3.5 w-3.5 text-emerald-500 flex-shrink-0" />
                <span>11 Categories Cross-Referenced</span>
              </div>
              <div className="flex items-center gap-2">
                <Icon name="CheckCircle2" className="h-3.5 w-3.5 text-emerald-500 flex-shrink-0" />
                <span>Predictive Date Scanner Active</span>
              </div>
            </div>
          </div>

          {/* Quick Prompts Library */}
          <div className="rounded-2xl border border-border/60 bg-card/40 p-3.5 shadow-xs backdrop-blur-sm flex-1 flex flex-col min-h-0">
            <div className="flex items-center gap-2 text-foreground font-semibold text-[11px] uppercase tracking-wider mb-2">
              <Icon name="Sparkles" className="h-3.5 w-3.5 text-amber-500" />
              <span>Suggested Prompts</span>
            </div>
            <div className="space-y-2 overflow-y-auto flex-1 pr-1">
              {currentCoach.suggestedQuestions.map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => sendMessage(q)}
                  disabled={loading}
                  className="w-full text-left rounded-xl border border-border/60 bg-background/70 hover:border-indigo-500/50 hover:bg-indigo-500/5 p-2.5 text-xs text-foreground transition-all leading-snug group"
                >
                  <span className="text-muted-foreground group-hover:text-indigo-500 transition-colors">💡 </span>
                  {q}
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* Right Main Chat Interface */}
        <div className="flex flex-1 min-w-0 flex-col overflow-hidden rounded-3xl border border-border/60 bg-card/50 shadow-xs backdrop-blur-md">
          {/* Header Bar */}
          <div className="flex flex-shrink-0 items-center justify-between border-b border-border/40 bg-card/80 px-4 sm:px-5 py-3 backdrop-blur-md">
            <div className="flex items-center gap-3 min-w-0">
              <div
                className="flex h-9 w-9 items-center justify-center rounded-xl text-white shadow-xs flex-shrink-0"
                style={{ background: currentCoach.color }}
              >
                <Icon name={currentCoach.icon} className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h2 className="text-sm sm:text-base font-bold leading-none tracking-tight text-foreground truncate">{currentCoach.name}</h2>
                  <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex-shrink-0">
                    Online
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground truncate">{currentCoach.tagline}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={() => setView("settings")}
                className="hidden sm:inline-flex items-center gap-1.5 rounded-xl border border-border/60 px-3 py-1.5 text-xs text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              >
                <Icon name="Settings" className="h-3.5 w-3.5" />
                <span>AI Preferences</span>
              </button>
              <button
                onClick={handleClearHistory}
                className="rounded-xl border border-border/60 p-2 text-xs text-muted-foreground transition-colors hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40"
                title="Clear Conversation History"
              >
                <Icon name="RotateCcw" className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Messages Area (Full-Height Scrollable) */}
          <div className="flex-1 min-h-0 space-y-4 overflow-y-auto p-4 sm:p-6">
            {/* Disclaimer Banner */}
            <div className="rounded-2xl border border-border/50 bg-muted/20 p-3 text-xs text-muted-foreground">
              <div className="flex items-start gap-2">
                <Icon name="Info" className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-indigo-500" />
                <div>
                  <span className="font-semibold text-foreground">Coach Guidance Note: </span>
                  {currentCoach.disclaimer}
                </div>
              </div>
            </div>

            {/* Empty State / Welcome Screen */}
            {messages.length === 0 && (
              <div className="space-y-4 py-4">
                <div className="flex items-start gap-3">
                  <div
                    className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl text-white shadow-xs"
                    style={{ background: currentCoach.color }}
                  >
                    <Icon name={currentCoach.icon} className="h-4 w-4" />
                  </div>
                  <div className="max-w-2xl rounded-2xl border border-border/60 bg-card p-4 text-sm leading-relaxed text-foreground shadow-xs">
                    {currentCoach.welcomeMessage}
                  </div>
                </div>

                {/* Mobile/Tablet Suggested Questions */}
                <div className="pt-2 pl-11 lg:hidden">
                  <div className="text-xs font-semibold text-muted-foreground mb-2">Tap a question to get started:</div>
                  <div className="flex flex-wrap gap-2">
                    {currentCoach.suggestedQuestions.map((q, idx) => (
                      <button
                        key={idx}
                        onClick={() => sendMessage(q)}
                        className="rounded-xl border border-border/80 bg-background/80 px-3 py-1.5 text-left text-xs text-foreground transition-all hover:border-indigo-500/50 hover:bg-indigo-500/5"
                      >
                        💡 {q}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Message List */}
            {messages.map((msg) => {
              const isUser = msg.role === "user";
              return (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn("flex items-start gap-3", isUser ? "flex-row-reverse" : "flex-row")}
                >
                  {!isUser ? (
                    <div
                      className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl text-white shadow-xs"
                      style={{ background: currentCoach.color }}
                    >
                      <Icon name={currentCoach.icon} className="h-4 w-4" />
                    </div>
                  ) : (
                    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl bg-foreground text-background shadow-xs">
                      <Icon name="User" className="h-4 w-4" />
                    </div>
                  )}

                  <div
                    className={cn(
                      "max-w-2xl rounded-2xl p-4 text-sm leading-relaxed shadow-xs",
                      isUser
                        ? "bg-indigo-600 text-white"
                        : "border border-border/60 bg-card text-foreground"
                    )}
                  >
                    {isUser ? (
                      <div className="whitespace-pre-wrap">{msg.content}</div>
                    ) : (
                      <div className="prose prose-sm dark:prose-invert max-w-none space-y-2 [&>ul]:list-disc [&>ul]:pl-5 [&>ol]:list-decimal [&>ol]:pl-5 [&>h3]:text-base [&>h3]:font-bold [&>blockquote]:border-l-4 [&>blockquote]:border-indigo-500 [&>blockquote]:pl-3 [&>blockquote]:italic">
                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}

            {/* Loading indicator */}
            {loading && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-3">
                <div
                  className="flex h-8 w-8 items-center justify-center rounded-xl text-white shadow-xs"
                  style={{ background: currentCoach.color }}
                >
                  <Icon name={currentCoach.icon} className="h-4 w-4 animate-pulse" />
                </div>
                <div className="inline-flex items-center gap-2 rounded-2xl border border-border/60 bg-card px-4 py-3 text-xs text-muted-foreground shadow-xs">
                  <Icon name="Loader2" className="h-3.5 w-3.5 animate-spin text-indigo-500" />
                  Thinking & analyzing your verified records…
                </div>
              </motion.div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Pinned Bottom Input Bar */}
          <div className="border-t border-border/40 bg-card/90 p-3 sm:p-4 backdrop-blur-md flex-shrink-0">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                sendMessage();
              }}
              className="flex items-end gap-2"
            >
              <textarea
                rows={1}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
                placeholder={`Ask ${currentCoach.name} anything… (Press Enter to send)`}
                className="max-h-32 min-h-[44px] flex-1 resize-none rounded-2xl border border-border/80 bg-background px-4 py-2.5 text-sm outline-none transition-colors focus:border-indigo-500 text-foreground"
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-sm transition-opacity hover:opacity-90 disabled:opacity-40"
              >
                <Icon name="Send" className="h-4 w-4" />
              </button>
            </form>
            <div className="mt-1.5 flex items-center justify-between text-[11px] text-muted-foreground">
              <span className="flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 inline-block" />
                Grounded in Verified Records · Free Demo Mode Active
              </span>
              <span className="hidden sm:inline">Shift + Enter for new line</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
