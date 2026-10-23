// AI Life Coach — shared constants & metadata
// All 11 life categories, 6 specialized coaches, document types, and item models.

export type DomainKey =
  | "health_wellness"
  | "financial_money"
  | "education_learning"
  | "career_work"
  | "legal_government"
  | "family_relationships"
  | "property_assets"
  | "travel_experiences"
  | "hobbies_skills"
  | "insurance_protection"
  | "daily_personal"
  // Legacy aliases for backward compatibility:
  | "health"
  | "wealth"
  | "growth"
  | "network"
  | "creativity"
  | "admin"
  | "mind_soul"
  | "time_action";

export interface DomainMeta {
  key: string;
  name: string;
  short: string;
  categoryNumber: number;
  description: string;
  icon: string; // lucide icon name
  color: string; // hex
  accent: string;
  order: number;
  coachType: string;
  documentTypes: { key: string; label: string; icon: string }[];
}

// ─── 11 Primary Life Categories ─────────────────────────────────────────────
export const DOMAINS: DomainMeta[] = [
  {
    key: "health_wellness",
    name: "Health & Wellness",
    short: "Health",
    categoryNumber: 1,
    description: "Medical records, vaccinations, prescriptions, fitness metrics, sleep, allergies, appointments.",
    icon: "HeartPulse",
    color: "#ef4444",
    accent: "rose",
    order: 1,
    coachType: "health",
    documentTypes: [
      { key: "medical_report", label: "Medical Report / Lab Result", icon: "FileText" },
      { key: "prescription", label: "Prescription", icon: "Pill" },
      { key: "vaccination_record", label: "Vaccination Record", icon: "Shield" },
      { key: "allergy_record", label: "Allergy Information", icon: "AlertTriangle" },
      { key: "doctor_notes", label: "Doctor / Specialist Notes", icon: "ClipboardList" },
      { key: "dental_vision", label: "Dental & Vision Records", icon: "Eye" },
    ],
  },
  {
    key: "financial_money",
    name: "Financial & Money",
    short: "Finances",
    categoryNumber: 2,
    description: "Income, expenses, budgets, savings goals, investments, bills, tax documents, statements.",
    icon: "Wallet",
    color: "#10b981",
    accent: "emerald",
    order: 2,
    coachType: "finance",
    documentTypes: [
      { key: "tax_return", label: "Tax Return / W2 / 1099", icon: "FileSpreadsheet" },
      { key: "bank_statement", label: "Bank / Investment Statement", icon: "Building" },
      { key: "bill_receipt", label: "Major Bill or Receipt", icon: "Receipt" },
      { key: "loan_mortgage", label: "Loan / Mortgage Agreement", icon: "Landmark" },
      { key: "retirement_plan", label: "Retirement / 401k Plan", icon: "TrendingUp" },
    ],
  },
  {
    key: "education_learning",
    name: "Education & Learning",
    short: "Education",
    categoryNumber: 3,
    description: "Degrees, certificates, courses, books, learning notes, skills, study plans, milestones.",
    icon: "GraduationCap",
    color: "#3b82f6",
    accent: "blue",
    order: 3,
    coachType: "life",
    documentTypes: [
      { key: "diploma_degree", label: "Diploma / Degree Certificate", icon: "Award" },
      { key: "course_certificate", label: "Course / Certification", icon: "CheckCircle2" },
      { key: "transcript", label: "Academic Transcript", icon: "FileText" },
      { key: "professional_license", label: "Professional License", icon: "BadgeCheck" },
      { key: "study_notes", label: "Curriculum / Study Notes", icon: "BookOpen" },
    ],
  },
  {
    key: "career_work",
    name: "Career & Work",
    short: "Career",
    categoryNumber: 4,
    description: "Employment history, projects, achievements, skills, CVs, portfolios, job applications.",
    icon: "Briefcase",
    color: "#8b5cf6",
    accent: "purple",
    order: 4,
    coachType: "career",
    documentTypes: [
      { key: "resume_cv", label: "Resume / CV", icon: "FileUser" },
      { key: "employment_contract", label: "Employment Contract / Offer", icon: "FileSignature" },
      { key: "performance_review", label: "Performance Review", icon: "TrendingUp" },
      { key: "recommendation_letter", label: "Letter of Recommendation", icon: "Mail" },
      { key: "portfolio_doc", label: "Work Portfolio / Case Study", icon: "FolderArchive" },
    ],
  },
  {
    key: "legal_government",
    name: "Legal & Government",
    short: "Legal & Gov",
    categoryNumber: 5,
    description: "Identity documents, passports, driver's licenses, government docs, contracts, legal notices, wills.",
    icon: "Scale",
    color: "#6366f1",
    accent: "indigo",
    order: 5,
    coachType: "predictive",
    documentTypes: [
      { key: "passport", label: "Passport", icon: "Globe" },
      { key: "drivers_license", label: "Driver's License / State ID", icon: "CreditCard" },
      { key: "birth_certificate", label: "Birth Certificate", icon: "FileHeart" },
      { key: "will_testament", label: "Will / Living Trust / Power of Attorney", icon: "Scroll" },
      { key: "contract_legal", label: "Legal Contract / Agreement", icon: "FileCheck2" },
      { key: "social_security", label: "Social Security / National ID", icon: "ShieldAlert" },
    ],
  },
  {
    key: "family_relationships",
    name: "Family & Relationships",
    short: "Family",
    categoryNumber: 6,
    description: "Family tree, birthdays, anniversaries, emergency contacts, important dates, shared memories.",
    icon: "Users",
    color: "#ec4899",
    accent: "pink",
    order: 6,
    coachType: "life",
    documentTypes: [
      { key: "marriage_cert", label: "Marriage Certificate", icon: "Heart" },
      { key: "family_tree", label: "Family Tree & Genealogy", icon: "Network" },
      { key: "emergency_contacts_doc", label: "Emergency Contacts Plan", icon: "PhoneCall" },
      { key: "pet_records", label: "Pet Records & Vet History", icon: "Dog" },
    ],
  },
  {
    key: "property_assets",
    name: "Property & Assets",
    short: "Property",
    categoryNumber: 7,
    description: "Homes, rental properties, vehicles, electronics, valuables, ownership deeds, warranties, maintenance.",
    icon: "Home",
    color: "#f59e0b",
    accent: "amber",
    order: 7,
    coachType: "predictive",
    documentTypes: [
      { key: "property_deed", label: "Property Deed / Title", icon: "Building2" },
      { key: "vehicle_title", label: "Vehicle Title / Registration", icon: "Car" },
      { key: "warranty_receipt", label: "Warranty & Purchase Receipt", icon: "Shield" },
      { key: "lease_agreement", label: "Lease / Rental Agreement", icon: "Key" },
      { key: "maintenance_log", label: "Maintenance / Service Record", icon: "Wrench" },
    ],
  },
  {
    key: "travel_experiences",
    name: "Travel & Experiences",
    short: "Travel",
    categoryNumber: 8,
    description: "Trips, itineraries, bookings, travel documents, travel expenses, bucket list destinations.",
    icon: "Plane",
    color: "#06b6d4",
    accent: "cyan",
    order: 8,
    coachType: "life",
    documentTypes: [
      { key: "visa_permit", label: "Visa / Travel Permit", icon: "Stamp" },
      { key: "flight_ticket", label: "Flight / Train Tickets", icon: "PlaneTakeoff" },
      { key: "hotel_booking", label: "Lodging & Hotel Confirmation", icon: "Hotel" },
      { key: "travel_itinerary", label: "Trip Itinerary & Guides", icon: "Map" },
    ],
  },
  {
    key: "hobbies_skills",
    name: "Hobbies & Skills",
    short: "Hobbies",
    categoryNumber: 9,
    description: "Photography, music, crafts, creative work, practice sessions, hobby income & monetization.",
    icon: "Palette",
    color: "#d946ef",
    accent: "fuchsia",
    order: 9,
    coachType: "hobby",
    documentTypes: [
      { key: "hobby_project", label: "Project Notes & Blueprints", icon: "Lightbulb" },
      { key: "creative_portfolio", label: "Creative Work Portfolio", icon: "Image" },
      { key: "equipment_manual", label: "Gear / Equipment Specs", icon: "Cpu" },
      { key: "monetization_plan", label: "Monetization & Sales Notes", icon: "Coins" },
    ],
  },
  {
    key: "insurance_protection",
    name: "Insurance & Protection",
    short: "Insurance",
    categoryNumber: 10,
    description: "Policies, coverage, policy numbers, claims, renewal dates, uploaded policies, beneficiaries.",
    icon: "ShieldCheck",
    color: "#14b8a6",
    accent: "teal",
    order: 10,
    coachType: "predictive",
    documentTypes: [
      { key: "health_insurance_policy", label: "Health Insurance Policy", icon: "HeartPulse" },
      { key: "auto_insurance_policy", label: "Auto Insurance Policy", icon: "Car" },
      { key: "home_insurance_policy", label: "Home / Renters Insurance", icon: "Home" },
      { key: "life_insurance_policy", label: "Life Insurance Policy", icon: "Shield" },
      { key: "insurance_claim", label: "Insurance Claim Documentation", icon: "FileText" },
    ],
  },
  {
    key: "daily_personal",
    name: "Daily Life & Personal",
    short: "Daily Life",
    categoryNumber: 11,
    description: "Daily mood, journal entries, interests, achievements, personal goals, routines, reflections, gratitude.",
    icon: "Sun",
    color: "#f97316",
    accent: "orange",
    order: 11,
    coachType: "life",
    documentTypes: [
      { key: "personal_journal_entry", label: "Journal / Reflection", icon: "BookMarked" },
      { key: "milestone_record", label: "Life Milestone Record", icon: "Flag" },
      { key: "vision_board", label: "Vision & Goals Document", icon: "Target" },
      { key: "routine_plan", label: "Daily Routine Schedule", icon: "ListChecks" },
    ],
  },
];

// Map from category key (and legacy aliases) to category metadata
export const DOMAIN_MAP: Record<string, DomainMeta> = {};
DOMAINS.forEach((d) => {
  DOMAIN_MAP[d.key] = d;
});

// Legacy domain key aliases mapping
const LEGACY_ALIASES: Record<string, string> = {
  health: "health_wellness",
  wealth: "financial_money",
  growth: "education_learning",
  network: "family_relationships",
  creativity: "hobbies_skills",
  admin: "legal_government",
  mind_soul: "daily_personal",
  time_action: "daily_personal",
};

Object.entries(LEGACY_ALIASES).forEach(([legacy, modern]) => {
  if (DOMAIN_MAP[modern]) {
    DOMAIN_MAP[legacy] = DOMAIN_MAP[modern];
  }
});

// ─── 6 Specialized AI Coaches ────────────────────────────────────────────────
export interface AICoachMeta {
  type: "health" | "finance" | "career" | "life" | "hobby" | "predictive" | "unified";
  name: string;
  tagline: string;
  icon: string;
  color: string;
  bgGradient: string;
  categoryKeys: string[];
  disclaimer: string;
  welcomeMessage: string;
  suggestedQuestions: string[];
}

export const AI_COACHES: AICoachMeta[] = [
  {
    type: "health",
    name: "Health & Wellness Coach",
    tagline: "Medical records organization, wellness routines, appointment prep",
    icon: "HeartPulse",
    color: "#ef4444",
    bgGradient: "from-rose-500/10 via-rose-500/5 to-transparent",
    categoryKeys: ["health_wellness"],
    disclaimer: "Provides general wellness education and personal health organization. Never diagnoses conditions or replaces professional medical advice.",
    welcomeMessage: "Hello! I'm your Health & Wellness Coach. I can help you organize medical records, prepare questions for your next doctor's visit, track your vaccinations, and build consistent wellness routines. How can I support your health today?",
    suggestedQuestions: [
      "Help me summarize my latest health checkups and vaccination dates.",
      "What questions should I ask my doctor at my upcoming annual checkup?",
      "Review my recorded sleep and energy patterns this week.",
      "What health records am I missing in my vault?",
    ],
  },
  {
    type: "finance",
    name: "Financial & Money Coach",
    tagline: "Spending summaries, budget tracking, savings goals, financial education",
    icon: "CircleDollarSign",
    color: "#10b981",
    bgGradient: "from-emerald-500/10 via-emerald-500/5 to-transparent",
    categoryKeys: ["financial_money", "insurance_protection", "property_assets"],
    disclaimer: "Educational guidance grounded strictly in your user-entered financial information. Not a certified financial planner or fiduciary.",
    welcomeMessage: "Welcome! I'm your Financial Coach. Let's look over your recorded income, expenses, upcoming subscriptions, and savings milestones to optimize your financial wellness.",
    suggestedQuestions: [
      "Summarize my recorded monthly expenses and active subscriptions.",
      "How am I progressing toward my emergency fund and savings goals?",
      "Which bills or tax documents should I make sure are up to date?",
      "Help me identify spending categories where I can cut back.",
    ],
  },
  {
    type: "career",
    name: "Career & Growth Coach",
    tagline: "Career milestones, CV improvements, interview prep, skill gap analysis",
    icon: "Briefcase",
    color: "#8b5cf6",
    bgGradient: "from-purple-500/10 via-purple-500/5 to-transparent",
    categoryKeys: ["career_work", "education_learning"],
    disclaimer: "Action-oriented career strategy, resume review, and skill growth assistance.",
    welcomeMessage: "Hi! I'm your Career Coach. Whether you are aiming for a promotion, polishing your CV, tracking professional milestones, or preparing for interviews, I'm here to help you advance.",
    suggestedQuestions: [
      "Review my recent career achievements and suggest bullet points for my CV.",
      "Help me map out a 6-month skill development plan for my role.",
      "Conduct a mock interview for a senior role in my field.",
      "What certifications or learning milestones should I target next?",
    ],
  },
  {
    type: "life",
    name: "Life & Mindset Coach",
    tagline: "Goal setting, habit consistency, reflective journaling, personal accountability",
    icon: "Compass",
    color: "#3b82f6",
    bgGradient: "from-blue-500/10 via-blue-500/5 to-transparent",
    categoryKeys: ["daily_personal", "education_learning", "family_relationships"],
    disclaimer: "Supportive life coaching and personal accountability. Not psychological therapy or psychiatric care.",
    welcomeMessage: "Welcome! I'm your Life Coach. I'm here to help you articulate meaningful goals, stay accountable to your daily habits, and reflect on what brings balance and fulfillment to your days.",
    suggestedQuestions: [
      "Help me do a weekly life audit of my top goals and habit streaks.",
      "What daily routine would help me focus on my top 3 priorities?",
      "I'm feeling overwhelmed — let's break down my active tasks into easy steps.",
      "Give me a thoughtful journaling prompt for today's reflection.",
    ],
  },
  {
    type: "hobby",
    name: "Hobby & Creative Coach",
    tagline: "Creative projects, skill practice schedules, monetization opportunities",
    icon: "Palette",
    color: "#d946ef",
    bgGradient: "from-fuchsia-500/10 via-fuchsia-500/5 to-transparent",
    categoryKeys: ["hobbies_skills", "travel_experiences"],
    disclaimer: "Creative encouragement and realistic monetization ideas without income guarantees.",
    welcomeMessage: "Hello! I'm your Hobby & Creative Coach. Let's turn your passions, photography, writing, music, or crafts into fulfilling skills — and explore practical ways to share or monetize your work.",
    suggestedQuestions: [
      "How could I potentially monetize my photography or creative craft?",
      "Design a realistic 3-day/week practice schedule for my new hobby.",
      "Help me outline a portfolio project from start to finish.",
      "What creative milestone should I challenge myself with next?",
    ],
  },
  {
    type: "predictive",
    name: "Predictive Life Coach",
    tagline: "Cross-category synthesis, upcoming renewals, expiring documents, smart alerts",
    icon: "Sparkles",
    color: "#f59e0b",
    bgGradient: "from-amber-500/10 via-amber-500/5 to-transparent",
    categoryKeys: ["insurance_protection", "legal_government", "property_assets", "health_wellness"],
    disclaimer: "Synthesizes your verified records and dates into proactive suggestions. Does not make deterministic predictions about your future.",
    welcomeMessage: "Greetings! I'm your Predictive Coach. I monitor your documents, policies, renewal dates, and deadlines across all 11 life areas to alert you before important things expire or slip through the cracks.",
    suggestedQuestions: [
      "Scan my vault for any documents, passports, or policies expiring soon.",
      "Are there any life categories where I haven't added records recently?",
      "Analyze cross-category patterns between my recorded habits and goals.",
      "What upcoming deadlines or renewals require my attention this month?",
    ],
  },
  {
    type: "unified",
    name: "Unified AI Life Coach",
    tagline: "Full access across all 11 categories, document vault, and life goals",
    icon: "Brain",
    color: "#10b981",
    bgGradient: "from-emerald-500/10 via-teal-500/5 to-transparent",
    categoryKeys: DOMAINS.map((d) => d.key),
    disclaimer: "Your central AI life companion with intelligent cross-category synthesis.",
    welcomeMessage: "Hello! I am your AI Life Coach. I have an interconnected view of your documents, health logs, career plans, finances, and goals. Ask me anything, or choose a specialized coach from above.",
    suggestedQuestions: [
      "Give me my AI Daily Briefing for today.",
      "Which life categories need the most attention right now?",
      "What are my highest priority items due this week?",
      "Help me organize my personal document vault.",
    ],
  },
];

export const AI_COACH_MAP: Record<string, AICoachMeta> = Object.fromEntries(
  AI_COACHES.map((c) => [c.type, c]),
);

// ─── Item Types ─────────────────────────────────────────────────────────────
export type ItemType =
  | "task"
  | "note"
  | "journal"
  | "habit"
  | "event"
  | "finance"
  | "contact"
  | "idea"
  | "goal"
  | "document"
  | "bookmark"
  | "milestone"
  | "routine"
  | "symptom"
  | "medication"
  | "affirmation"
  | "vision";

export interface ItemTypeMeta {
  type: ItemType;
  name: string;
  icon: string;
  color: string;
  hasDate?: boolean;
  completable?: boolean;
}

export const ITEM_TYPES: ItemTypeMeta[] = [
  { type: "task", name: "Task", icon: "CheckSquare", color: "#f59e0b", hasDate: true, completable: true },
  { type: "note", name: "Note", icon: "StickyNote", color: "#eab308" },
  { type: "journal", name: "Journal", icon: "BookHeart", color: "#a78bfa", hasDate: true },
  { type: "habit", name: "Habit", icon: "Repeat", color: "#10b981" },
  { type: "event", name: "Event", icon: "Calendar", color: "#06b6d4", hasDate: true },
  { type: "finance", name: "Finance", icon: "Wallet", color: "#10b981", hasDate: true },
  { type: "contact", name: "Contact", icon: "User", color: "#06b6d4" },
  { type: "idea", name: "Idea", icon: "Lightbulb", color: "#ec4899" },
  { type: "goal", name: "Goal", icon: "Target", color: "#f43f5e", hasDate: true },
  { type: "document", name: "Document", icon: "FileText", color: "#71717a" },
  { type: "bookmark", name: "Bookmark", icon: "Bookmark", color: "#3b82f6" },
  { type: "milestone", name: "Milestone", icon: "Flag", color: "#f59e0b", hasDate: true, completable: true },
  { type: "routine", name: "Routine", icon: "ListChecks", color: "#eab308" },
  { type: "symptom", name: "Symptom", icon: "Thermometer", color: "#f43f5e", hasDate: true },
  { type: "medication", name: "Medication", icon: "Pill", color: "#f43f5e", hasDate: true },
  { type: "affirmation", name: "Affirmation", icon: "Heart", color: "#a78bfa" },
  { type: "vision", name: "Vision", icon: "Eye", color: "#a78bfa" },
];

export const ITEM_TYPE_MAP: Record<string, ItemTypeMeta> = Object.fromEntries(
  ITEM_TYPES.map((t) => [t.type, t]),
);

export type ItemStatus = "inbox" | "active" | "done" | "archived" | "snoozed";

export const STATUS_META: Record<ItemStatus, { name: string; color: string }> = {
  inbox: { name: "Inbox", color: "#71717a" },
  active: { name: "Active", color: "#10b981" },
  done: { name: "Done", color: "#3b82f6" },
  archived: { name: "Archived", color: "#71717a" },
  snoozed: { name: "Snoozed", color: "#f59e0b" },
};

export const PRIORITY_META = [
  { value: 0, name: "None", color: "#71717a" },
  { value: 1, name: "Low", color: "#3b82f6" },
  { value: 2, name: "Medium", color: "#eab308" },
  { value: 3, name: "High", color: "#f59e0b" },
  { value: 4, name: "Urgent", color: "#f43f5e" },
];

export const ENERGY_META = [
  { value: 0, name: "—", color: "#71717a" },
  { value: 1, name: "Low", color: "#3b82f6" },
  { value: 2, name: "Medium", color: "#eab308" },
  { value: 3, name: "High", color: "#f43f5e" },
];

export const REVIEW_PROMPTS = {
  daily: {
    wins: "What went well today?",
    challenges: "What didn't go as planned?",
    learnings: "What did you learn?",
    gratitude: "What are you grateful for?",
    priorities: "What's your top focus for tomorrow?",
  },
  weekly: {
    wins: "What were this week's wins?",
    challenges: "What drained you or blocked progress?",
    learnings: "What did you learn about yourself?",
    gratitude: "Who or what are you grateful for this week?",
    priorities: "What 3 things matter most next week?",
  },
};
