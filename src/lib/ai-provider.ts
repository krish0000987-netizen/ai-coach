// AI Provider abstraction for AI Life Coach
// Supports OpenRouter API (with openrouter/free default), OpenAI-compatible APIs, and Free Demo Mode.
import { db } from "@/lib/db";
import { getUserFromRequest } from "./auth-utils";
import { AI_COACH_MAP, AICoachMeta } from "./constants";
import type { NextRequest } from "next/server";

export interface AIPrefs {
  aiEnabled: boolean;
  aiProvider: "openrouter" | "openai-compatible" | "demo";
  aiApiKey: string;
  aiBaseUrl: string;
  aiModel: string;
}

const DEFAULT_PREFS: AIPrefs = {
  aiEnabled: true,
  aiProvider: "openrouter",
  aiApiKey: process.env.OPENROUTER_API_KEY || "",
  aiBaseUrl: process.env.OPENROUTER_BASE_URL || "https://openrouter.ai/api/v1",
  aiModel: process.env.OPENROUTER_MODEL || "openrouter/free",
};

export async function getAIPrefs(req?: NextRequest): Promise<AIPrefs> {
  const envKey = process.env.OPENROUTER_API_KEY || "";
  const base: AIPrefs = {
    ...DEFAULT_PREFS,
    aiApiKey: envKey,
  };

  if (!req) return base;

  try {
    const session = await getUserFromRequest(req);
    if (!session) return base;

    const setting = await db.setting.findUnique({ where: { id: `prefs-${session.userId}` } });
    if (!setting) return base;

    const userPrefs = JSON.parse(setting.value);
    return {
      ...base,
      ...userPrefs,
      // Priority: user setting apiKey -> env apiKey
      aiApiKey: userPrefs.aiApiKey || envKey,
    };
  } catch {
    return base;
  }
}

// Generate Coach-Specific System Prompts with strict safety guidelines & tone
export function buildCoachSystemPrompt(
  coachType: string,
  userContext?: {
    userName?: string;
    itemsSummary?: string;
    documentsSummary?: string;
    remindersSummary?: string;
  }
): string {
  const coach = AI_COACH_MAP[coachType] || AI_COACH_MAP["unified"];
  const user = userContext?.userName || "the user";

  let specificRole = "";
  switch (coachType) {
    case "health":
      specificRole = `You are a warm, knowledgeable Health & Wellness Coach.
- Your mission is to help ${user} organize medical records, lab tests, prescriptions, and vaccination history.
- Provide general wellness education, hydration/sleep tips, and help prepare thoughtful questions for healthcare providers.
- CRITICAL SAFETY: NEVER diagnose illnesses or prescribe medication. Always advise consulting a qualified physician.`;
      break;

    case "finance":
      specificRole = `You are an encouraging, pragmatic Financial & Money Coach.
- Your mission is to help ${user} understand their cash flow, track recurring bills, and progress toward savings goals.
- Provide educational guidance grounded strictly in the user's recorded expenses and income.
- CRITICAL DISCLAIMER: You are an educational guide, not a certified financial planner. Do not invent bank account balances.`;
      break;

    case "career":
      specificRole = `You are an empowering, strategic Career & Growth Coach.
- Your mission is to assist ${user} with career milestones, skill development, CV polish, interview prep, and job applications.
- Help turn work experience into measurable impact statements. Identify high-leverage skills to learn next.`;
      break;

    case "life":
      specificRole = `You are an empathetic, insightful Life & Accountability Coach.
- Your mission is to help ${user} set meaningful goals, build sustainable daily routines, and reflect through journaling.
- Offer constructive accountability, positive reinforcement, and gentle inquiries when tasks are delayed.`;
      break;

    case "hobby":
      specificRole = `You are an inspiring Hobby & Creative Coach.
- Your mission is to help ${user} nurture creative passions, design realistic practice routines, and explore realistic ways to monetize hobbies (photography, writing, crafts, music).
- Do not guarantee income; focus on craft, fulfillment, and practical audience-building.`;
      break;

    case "predictive":
      specificRole = `You are an analytical, proactive Predictive Life Coach.
- Your mission is to synthesize verified dates, expiring documents, upcoming insurance renewals, and overdue goals across all 11 life areas.
- Distinguish verified facts from AI-generated suggestions. Alert the user politely before important documents or policies expire.`;
      break;

    default:
      specificRole = `You are the Unified AI Life Coach, an interconnected personal assistant managing all 11 life categories: Health, Finances, Education, Career, Legal, Family, Property, Travel, Hobbies, Insurance, and Daily Life.`;
  }

  const contextSection = `
CURRENT VERIFIED USER CONTEXT:
User Name: ${user}
${userContext?.itemsSummary ? `Key Active Records:\n${userContext.itemsSummary}` : "No specific active items recorded yet."}
${userContext?.documentsSummary ? `Vault Documents:\n${userContext.documentsSummary}` : "No documents uploaded yet."}
${userContext?.remindersSummary ? `Upcoming Alerts & Reminders:\n${userContext.remindersSummary}` : "No pending alerts."}
`;

  return `${specificRole}

${contextSection}

GUIDELINES:
1. Always be concise, actionable, and structured (use bullet points and bold headers).
2. Respect privacy: only reference the information provided in the context above.
3. If the user asks about an expiring document or deadline, check the reminders context.
4. Keep the tone inspiring, professional, and grounded in reality.
5. End with a constructive follow-up question or recommended next step.`;
}

// Generate intelligent fallback response in Demo Mode
export function generateDemoResponse(
  coachType: string,
  userMessage: string,
  userContext?: {
    userName?: string;
    itemsSummary?: string;
    documentsSummary?: string;
    remindersSummary?: string;
  }
): string {
  const coach = AI_COACH_MAP[coachType] || AI_COACH_MAP["unified"];
  const msgLower = userMessage.toLowerCase();

  let advice = "";
  if (coachType === "health" || msgLower.includes("health") || msgLower.includes("doctor")) {
    advice = `### Health & Wellness Guidance
Based on your records, keeping medical documents up to date is essential for peace of mind.
- **Record Organization**: Store recent vaccination dates and annual lab panels in your Document Vault.
- **Doctor Preparation**: Write down 3 key questions before your next visit (symptom frequency, lifestyle adjustments, preventative screenings).
- **Daily Foundation**: Aim for consistent sleep windows and daily hydration tracking.`;
  } else if (coachType === "finance" || msgLower.includes("money") || msgLower.includes("spend")) {
    advice = `### Financial & Money Guidance
- **Spending Review**: Group your recurring subscriptions to eliminate unused services.
- **Emergency Reserve**: Aim for 3-6 months of essential living expenses in a liquid high-yield account.
- **Vault Reminder**: Keep your latest tax return (W2/1099) and insurance policy declarations securely indexed in your vault.`;
  } else if (coachType === "predictive" || msgLower.includes("expire") || msgLower.includes("renew") || msgLower.includes("remind")) {
    advice = `### Predictive Insights & Expiry Audit
- **Document Expiries**: I monitor your passports, driver's licenses, and insurance renewals. 
- **Renewal Lead Time**: We recommend beginning passport renewals 6-9 months before expiration, and shopping insurance rates 30 days before renewal.
- **Status**: ${userContext?.remindersSummary ? userContext.remindersSummary : "All active documents are currently within valid windows."}`;
  } else if (coachType === "career" || msgLower.includes("job") || msgLower.includes("resume") || msgLower.includes("career")) {
    advice = `### Career & Growth Strategy
- **Quantify Impact**: Update your resume quarterly with metric-driven accomplishments (e.g., "Increased team efficiency by 20%").
- **Skill Evolution**: Dedicate 2 hours weekly to high-leverage certifications or learning milestones.
- **Network Check**: Schedule one casual check-in with a former mentor or colleague every month.`;
  } else {
    advice = `### Life & Habit Insights
- **Top Focus**: Pick your single "Must-Win" priority for today before tackling secondary tasks.
- **Interconnected Life**: Balance work with recovery, creative pursuits, and family milestones.
- **Weekly Review**: Schedule a 15-minute weekly reflection every Sunday to assess wins and align priorities for the week ahead.`;
  }

  return `> [!NOTE]
> **Free Demo Mode Active**
> *Live AI connection via OpenRouter is available by adding an API key in **Settings → AI Preferences** or .env (OPENROUTER_API_KEY). Demonstration responses are synthesized from your verified life records.*

${advice}

**Next Recommended Step**:
Would you like help logging a new document in your vault, setting up a renewal reminder, or creating a milestone goal?`;
}

// Call AI Chat Completion (OpenRouter / Free Demo fallback)
export async function aiChatCompletion(
  prefs: AIPrefs,
  messages: { role: string; content: string }[],
  coachType: string = "unified",
  userContext?: {
    userName?: string;
    itemsSummary?: string;
    documentsSummary?: string;
    remindersSummary?: string;
  }
): Promise<string> {
  if (!prefs.aiEnabled) {
    throw new Error("AI coaching is currently disabled in your preferences.");
  }

  // If no API key is provided, use the high-quality Demo Mode
  if (!prefs.aiApiKey || prefs.aiApiKey.trim() === "" || prefs.aiProvider === "demo") {
    const lastUserMessage = [...messages].reverse().find((m) => m.role === "user")?.content || "";
    return generateDemoResponse(coachType, lastUserMessage, userContext);
  }

  // Build the complete system message
  const systemPrompt = buildCoachSystemPrompt(coachType, userContext);
  const fullMessages = [
    { role: "system", content: systemPrompt },
    ...messages.slice(-10), // Limit history to last 10 messages for token efficiency
  ];

  const baseUrl = prefs.aiBaseUrl || "https://openrouter.ai/api/v1";
  const model = prefs.aiModel || "openrouter/free";

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 25000); // 25s timeout

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${prefs.aiApiKey}`,
      "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "https://ai-coach.local",
      "X-Title": "AI Life Coach",
    };

    const res = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        model,
        messages: fullMessages,
        temperature: 0.7,
        max_tokens: 1200,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!res.ok) {
      const errText = await res.text();
      console.warn(`OpenRouter API responded with status ${res.status}: ${errText.slice(0, 150)}`);
      // If free model is busy or rate limited, gracefully fall back to Demo Mode with informative notice
      const lastUserMessage = [...messages].reverse().find((m) => m.role === "user")?.content || "";
      return generateDemoResponse(coachType, lastUserMessage, userContext);
    }

    const data = await res.json();
    const reply = data.choices?.[0]?.message?.content;
    if (!reply) {
      throw new Error("Empty response from AI provider");
    }

    return reply;
  } catch (err: any) {
    console.error("AI chat completion error:", err?.message || err);
    // Graceful fallback: never crash the UI
    const lastUserMessage = [...messages].reverse().find((m) => m.role === "user")?.content || "";
    return generateDemoResponse(coachType, lastUserMessage, userContext);
  }
}
