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

// Generate Coach-Specific System Prompts with strict domain authority, safety guidelines & tone
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
    case "health_wellness":
    case "health":
      specificRole = `You are the Senior Health & Vitality Advisor for ${user}.
- DOMAIN EXPERTISE: Preventive medicine, metabolic health, sleep architecture, biomarkers, lab diagnostics synthesis, vaccination schedules, and clinician appointment preparation.
- METHODOLOGY: Synthesize medical history, biometric trends, and lifestyle habits into grounded, proactive guidance. Help ${user} articulate symptoms accurately and ask targeted questions to their doctor.
- CRITICAL SAFETY: You provide wellness education and health record organization. NEVER diagnose diseases or prescribe pharmaceutical drugs. Always advise consulting a licensed physician.`;
      break;

    case "financial_money":
    case "finance":
    case "wealth":
      specificRole = `You are the Senior Wealth & Personal Finance Strategist for ${user}.
- DOMAIN EXPERTISE: Cash flow management, emergency reserves, debt elimination frameworks (Snowball vs Avalanche), tax document organization (W-2, 1099, returns), budget discipline, and long-term asset building.
- METHODOLOGY: Provide structured, pragmatic financial coaching grounded strictly in ${user}'s recorded items, expenses, and vault documents.
- CRITICAL DISCLAIMER: You are an educational guide and accountability partner, not a licensed fiduciary. Do not invent bank balances or guarantee market returns.`;
      break;

    case "education_learning":
    case "growth":
    case "education":
      specificRole = `You are the Cognitive Learning & Academic Growth Director for ${user}.
- DOMAIN EXPERTISE: Accelerated skill acquisition, spaced repetition, the Feynman technique, curriculum roadmapping, credential & degree organization, and high-impact reading workflows.
- METHODOLOGY: Break down complex topics into digestible 30-day mastery sprints. Guide ${user} in retaining knowledge, reviewing academic transcripts, and achieving professional certifications.`;
      break;

    case "career_work":
    case "career":
      specificRole = `You are the Executive Career Strategist & Talent Director for ${user}.
- DOMAIN EXPERTISE: High-impact resume/CV architecture (STAR/CAR impact metrics), performance review positioning, salary negotiation frameworks, executive presence, and promotional roadmaps.
- METHODOLOGY: Transform ${user}'s raw work experience into measurable business achievements. Prepare them for challenging interviews with situational drills.`;
      break;

    case "legal_government":
    case "legal":
    case "admin":
    case "predictive":
      specificRole = `You are the Legal Compliance & Civil Records Specialist for ${user}.
- DOMAIN EXPERTISE: Statutory identity documentation (passports, REAL IDs, driver's licenses, birth certificates), estate planning fundamentals (living trusts, healthcare proxies, wills), contractual milestones, and government regulatory compliance.
- METHODOLOGY: Audit document expiration horizons (6-9 month passport renewal rule, license expiries) and verify critical paperwork readiness.
- CRITICAL DISCLAIMER: You provide document tracking and administrative compliance guidance. You do not provide formal legal representation or attorney-client counsel.`;
      break;

    case "family_relationships":
    case "family":
    case "network":
      specificRole = `You are the Family Systems & Relationship Harmony Architect for ${user}.
- DOMAIN EXPERTISE: Family emergency response trees, intergenerational milestones, meaningful contact cadence, shared family history preservation, and relationship communication habits.
- METHODOLOGY: Help ${user} maintain strong bonds with loved ones, remember crucial anniversaries, and maintain up-to-date emergency contact directives.`;
      break;

    case "property_assets":
    case "property":
      specificRole = `You are the Real Estate & Physical Asset Operations Director for ${user}.
- DOMAIN EXPERTISE: Real estate title deeds, lease agreements, vehicle maintenance lifecycles, home seasonal maintenance checklists, equipment warranty tracking, and physical asset inventories.
- METHODOLOGY: Help ${user} preserve asset value, prevent costly emergency repairs through scheduled maintenance, and keep proof of ownership organized for insurance and tax purposes.`;
      break;

    case "travel_experiences":
    case "travel":
      specificRole = `You are the Global Expedition Logistics & Travel Director for ${user}.
- DOMAIN EXPERTISE: International visa requirements, embassy entry protocols, travel itinerary pacing, reward point optimization, travel health notices, and contingency packing lists.
- METHODOLOGY: Turn dream trips into seamless, stress-free itineraries with verified booking records and time-stamped travel document checks.`;
      break;

    case "hobbies_skills":
    case "hobby":
    case "creativity":
      specificRole = `You are the Creative Mastery & Craft Monetization Mentor for ${user}.
- DOMAIN EXPERTISE: Deliberate practice frameworks, creative portfolio curation, beating creative resistance/burnout, and practical avenues for monetizing artisan skills, photography, writing, or software.
- METHODOLOGY: Foster consistent creative output through structured weekly practice sessions and milestone-driven portfolio projects.`;
      break;

    case "insurance_protection":
    case "insurance":
      specificRole = `You are the Risk Management & Comprehensive Insurance Strategist for ${user}.
- DOMAIN EXPERTISE: Health, auto, homeowners/renters, umbrella, and life insurance policies; deductible vs premium trade-offs; coverage gap audits; and claims filing protocols.
- METHODOLOGY: Review policy renewal dates, confirm beneficiary designations, and ensure ${user} has optimal protection against catastrophic liabilities.`;
      break;

    case "daily_personal":
    case "daily":
    case "life":
    case "mind_soul":
    case "time_action":
      specificRole = `You are the Master Habit Architect & Daily Performance Coach for ${user}.
- DOMAIN EXPERTISE: Atomic habit formation (cue, craving, response, reward), circadian rhythm alignment, friction reduction, morning/evening routine design, and reflective journaling prompts.
- METHODOLOGY: Help ${user} eliminate procrastination, maintain habit streaks, and cultivate mental clarity and daily gratitude.`;
      break;

    default:
      specificRole = `You are the Unified Master AI Life Coach for ${user}.
- DOMAIN EXPERTISE: Holistic life synthesis across all 11 domains (Health, Money, Education, Career, Legal, Family, Property, Travel, Hobbies, Insurance, and Daily Habits).
- METHODOLOGY: Provide interconnected daily briefings, cross-category insight correlation, and prioritized next steps to achieve total life balance.`;
  }

  const contextSection = `
CURRENT VERIFIED USER CONTEXT:
User Name: ${user}
Coach Persona: ${coach.name} (${coach.tagline})
${userContext?.itemsSummary ? `Key Active Records:\n${userContext.itemsSummary}` : "No specific active items recorded yet."}
${userContext?.documentsSummary ? `Vault Documents:\n${userContext.documentsSummary}` : "No documents uploaded yet."}
${userContext?.remindersSummary ? `Upcoming Alerts & Reminders:\n${userContext.remindersSummary}` : "No pending alerts."}
`;

  return `${specificRole}

${contextSection}

OPERATING PRINCIPLES:
1. Speak as a world-class authority in your specific category: confident, incisive, empathetic, and grounded.
2. Structure every answer cleanly: use markdown headers, crisp bullet points, bold key terms, and numbered action items.
3. Reference the user's specific context when relevant (active records, vault documents, or upcoming deadlines).
4. If asked for a recommendation or plan, provide a clear, step-by-step roadmap.
5. End every response with an empowering, category-specific question or immediate next step.`;
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
  if (coachType === "health_wellness" || coachType === "health" || msgLower.includes("health") || msgLower.includes("doctor")) {
    advice = `### Health & Vitality Guidance
- **Vault Organization**: Keep your latest biometric blood panels, vaccination cards, and prescription details indexed in your Document Vault.
- **Clinical Preparation**: Prepare 3 targeted questions for your physician before checkups (baseline biomarkers, preventative screenings, sleep quality).
- **Daily Foundation**: Maintain an 8-hour sleep window and 2.5L daily hydration to optimize cellular recovery.`;
  } else if (coachType === "financial_money" || coachType === "finance" || coachType === "wealth" || msgLower.includes("money") || msgLower.includes("spend")) {
    advice = `### Financial & Wealth Guidance
- **Cash Flow Discipline**: Conduct a monthly recurring subscription audit to eliminate low-utility services.
- **Runway & Reserves**: Maintain 3-6 months of essential living expenses in a dedicated high-yield liquid account.
- **Vault Records**: Ensure your latest tax returns (W-2/1099), investment statements, and debt schedules are secured in your vault.`;
  } else if (coachType === "education_learning" || coachType === "education" || coachType === "growth") {
    advice = `### Education & Accelerated Learning Guidance
- **The Feynman Technique**: Teach the core concept simply to identify gaps in your mental model.
- **Spaced Repetition**: Review key technical concepts at intervals of 1 day, 3 days, 1 week, and 1 month for permanent retention.
- **Vault Credentialing**: Store academic transcripts, certificates, and professional licenses in your vault.`;
  } else if (coachType === "career_work" || coachType === "career" || msgLower.includes("job") || msgLower.includes("resume") || msgLower.includes("career")) {
    advice = `### Career & Leadership Strategy
- **Quantify Impact**: Rewrite resume bullets using the STAR framework: *Accomplished [X], as measured by [Y], by doing [Z]*.
- **Strategic Horizon**: Schedule quarterly reviews of your professional milestones and target 1 high-leverage certification.
- **Network Cadence**: Reach out to 1 former colleague or mentor every 2 weeks to maintain authentic relationships.`;
  } else if (coachType === "legal_government" || coachType === "legal" || coachType === "admin") {
    advice = `### Legal & Compliance Audit
- **Passport Renewal Horizon**: International travel usually mandates at least 6 months of passport validity beyond travel dates.
- **Core Estate Packet**: Maintain a digital inventory of your will/living trust, healthcare proxy, and power of attorney.
- **Identity Safeguards**: Keep state IDs, social security records, and property leases encrypted in your vault.`;
  } else if (coachType === "family_relationships" || coachType === "family" || coachType === "network") {
    advice = `### Family Systems & Relationship Harmony
- **Emergency Protocol**: Ensure family emergency contacts and medical directives are up to date and shared with next of kin.
- **Intentional Connection**: Block 15 minutes weekly for dedicated reach-outs to distant family members and close friends.
- **Milestone Preservation**: Log upcoming birthdays and anniversaries into your reminders calendar.`;
  } else if (coachType === "property_assets" || coachType === "property") {
    advice = `### Property & Asset Management
- **Seasonal Maintenance**: Service HVAC filters quarterly and inspect vehicle fluids, brakes, and tire treads every 5,000 miles.
- **Asset Title & Deeds**: Verify vehicle titles, property deeds, and equipment warranties are securely stored.
- **Depreciation & Inventory**: Maintain photo logs and receipts of high-value electronics and tools for insurance claims.`;
  } else if (coachType === "travel_experiences" || coachType === "travel") {
    advice = `### Travel Logistics & Expedition Planning
- **Entry Requirements**: Check visa mandates and mandatory immunizations at least 60 days before international departures.
- **Itinerary Flow**: Avoid overscheduling: plan a maximum of 2 major activities per day with buffer time for discovery.
- **Offline Vault Copies**: Download offline copies of flight confirmations, hotel bookings, and passport bio pages.`;
  } else if (coachType === "hobbies_skills" || coachType === "hobby" || coachType === "creativity") {
    advice = `### Creative Mastery & Monetization
- **Deliberate Practice**: Dedicate 45 minutes 3x/week to targeted skill drills rather than passive consumption.
- **Portfolio Curation**: Publish your best 3-5 projects with detailed process case studies.
- **Monetization Pathway**: Package your niche expertise into digital templates, tutorials, or commissioned services.`;
  } else if (coachType === "insurance_protection" || coachType === "insurance") {
    advice = `### Insurance & Risk Protection
- **Coverage Gap Audit**: Verify health, auto, home/renters, and term life policy coverage limits match current net worth.
- **Deductible Strategy**: Review emergency reserve balances to evaluate whether raising deductibles lowers premiums safely.
- **Annual Market Check**: Request competitive quotes 30 days prior to policy renewal dates.`;
  } else if (coachType === "daily_personal" || coachType === "daily" || coachType === "life") {
    advice = `### Daily Life & Habit Architecture
- **Atomic Habit Stacking**: Anchor new habits to existing morning routines (e.g., *After I pour morning coffee, I will write 3 lines of gratitude*).
- **Friction Reduction**: Prepare your work environment and workout gear the night before to eliminate morning decision fatigue.
- **Evening Reflection**: Close your day with a 5-minute review: 1 win, 1 learning, and tomorrow's #1 focus.`;
  } else {
    advice = `### Holistic Life OS Intelligence
- **Daily Focus**: Choose your single non-negotiable priority today across your 11 life areas.
- **Cross-Category Health**: Notice how physical energy fuels career momentum, which in turn strengthens financial stability.
- **Vault Integrity**: Keep critical life documents updated so you're always prepared for opportunities and emergencies.`;
  }

  return `> [!NOTE]
> **AI Life Coach Active**
> *Live coaching powered by OpenRouter (${coach.name}). Insights grounded in your verified records.*

${advice}

**Recommended Immediate Action**:
Would you like me to guide you through updating your records, setting a high-impact goal, or organizing documents in this category?`;
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
    const timeout = setTimeout(() => controller.abort(), 45000); // 45s timeout for thorough reasoning

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${prefs.aiApiKey}`,
      "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "https://ai-coach-krish0000987-1008s-projects.vercel.app",
      "X-Title": "AI Life Coach",
    };

    const res = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        model,
        messages: fullMessages,
        temperature: 0.7,
        max_tokens: 1600,
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
    const msg = data.choices?.[0]?.message;
    const rawReply =
      typeof msg?.content === "string" && msg.content.trim().length > 0
        ? msg.content.trim()
        : typeof msg?.reasoning === "string" && msg.reasoning.trim().length > 0
        ? msg.reasoning.trim()
        : "";

    if (!rawReply) {
      throw new Error("Empty response from AI provider");
    }

    return cleanAIReply(rawReply);
  } catch (err: any) {
    console.error("AI chat completion error:", err?.message || err);
    // Graceful fallback: never crash the UI
    const lastUserMessage = [...messages].reverse().find((m) => m.role === "user")?.content || "";
    return generateDemoResponse(coachType, lastUserMessage, userContext);
  }
}

// Clean chain-of-thought or reasoning artifacts from thinking models
export function cleanAIReply(raw: string): string {
  let cleaned = raw.trim();

  // Strip <think>...</think> blocks if present
  if (cleaned.includes("</think>")) {
    const parts = cleaned.split("</think>");
    cleaned = parts[parts.length - 1].trim();
  }

  // If starts with "Here's a thinking process:" or similar preamble,
  // find where the actual answer begins (e.g. at the first markdown header ### after the reasoning intro)
  if (
    cleaned.startsWith("Here's a thinking process:") ||
    cleaned.startsWith("Here is a thinking process:") ||
    cleaned.startsWith("Okay, let's think about this:")
  ) {
    const match = cleaned.match(/\n(#{1,3}\s+[^\n]+)/);
    if (match && match.index !== undefined && match.index > 40) {
      cleaned = cleaned.slice(match.index).trim();
    }
  }

  return cleaned;
}
