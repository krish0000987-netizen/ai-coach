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
    coachType: "health_wellness",
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
    coachType: "financial_money",
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
    coachType: "education_learning",
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
    coachType: "career_work",
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
    coachType: "legal_government",
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
    coachType: "family_relationships",
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
    coachType: "property_assets",
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
    coachType: "travel_experiences",
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
    coachType: "hobbies_skills",
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
    coachType: "insurance_protection",
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
    coachType: "daily_personal",
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

// ─── 11 Dedicated Category AI Coaches + 1 Unified Master Coach ───────────────
export interface AICoachMeta {
  type: string;
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
    type: "health_wellness",
    name: "Health & Vitality Coach",
    tagline: "Medical records organization, lab tests, vital trends, preventive wellness",
    icon: "HeartPulse",
    color: "#ef4444",
    bgGradient: "from-rose-500/10 via-rose-500/5 to-transparent",
    categoryKeys: ["health_wellness"],
    disclaimer: "Provides general wellness education and medical record organization. Does not diagnose or prescribe. Consult a physician.",
    welcomeMessage: "Hello! I'm your Health & Vitality Coach. I analyze your uploaded medical records, lab biometric history, prescription schedules, and wellness routines to keep you in peak health. How can I support your vitality today?",
    suggestedQuestions: [
      "Summarize my latest health checkups and vaccination records.",
      "What questions should I ask my physician at my next physical exam?",
      "Review my sleep habits, energy metrics, and hydration this week.",
      "What preventative screenings or health documents am I missing?",
    ],
  },
  {
    type: "financial_money",
    name: "Financial & Wealth Coach",
    tagline: "Cash flow optimization, net worth tracking, debt payoff, budget discipline",
    icon: "CircleDollarSign",
    color: "#10b981",
    bgGradient: "from-emerald-500/10 via-emerald-500/5 to-transparent",
    categoryKeys: ["financial_money"],
    disclaimer: "Educational guidance grounded in your entered financial records. Not a certified financial planner or fiduciary.",
    welcomeMessage: "Welcome! I'm your Financial & Wealth Coach. I review your recorded income, expenses, recurring subscriptions, investments, and savings milestones to optimize your financial runway. What are your money goals today?",
    suggestedQuestions: [
      "Audit my recorded monthly subscriptions and recurring bills.",
      "How am I pacing toward my 6-month emergency reserve and savings targets?",
      "What tax records or bank statements should I upload before the next quarter?",
      "Help me build an aggressive debt payoff or savings roadmap.",
    ],
  },
  {
    type: "education_learning",
    name: "Education & Learning Coach",
    tagline: "Accelerated learning frameworks, skill acquisition, study plans, certificates",
    icon: "GraduationCap",
    color: "#3b82f6",
    bgGradient: "from-blue-500/10 via-blue-500/5 to-transparent",
    categoryKeys: ["education_learning"],
    disclaimer: "Personalized educational coaching and study system guidance.",
    welcomeMessage: "Hi there! I'm your Education & Learning Coach. I help you master new subjects faster using Feynman frameworks, spaced repetition, curriculum mapping, and tracking certifications and reading lists. What skill or subject are we mastering today?",
    suggestedQuestions: [
      "Create a 30-day curriculum roadmap to master a new skill.",
      "How can I apply the Feynman technique to retain complex technical concepts?",
      "Review my reading list and suggest top books based on my learning goals.",
      "Help me organize my degrees, course certificates, and licenses in my vault.",
    ],
  },
  {
    type: "career_work",
    name: "Career & Leadership Coach",
    tagline: "Resume optimization, promotion readiness, salary negotiation, leadership impact",
    icon: "Briefcase",
    color: "#8b5cf6",
    bgGradient: "from-purple-500/10 via-purple-500/5 to-transparent",
    categoryKeys: ["career_work"],
    disclaimer: "Action-oriented executive career strategy and portfolio enhancement.",
    welcomeMessage: "Greetings! I'm your Career & Leadership Coach. From transforming your CV into quantified impact bullets to orchestrating promotion conversations and interview prep, I'm here to accelerate your professional trajectory. How can I assist your career today?",
    suggestedQuestions: [
      "Convert my recent work wins into quantified STAR resume bullets.",
      "Conduct a rigorous mock interview for a senior leadership position.",
      "How should I structure my upcoming performance review and salary negotiation?",
      "What professional certifications or high-leverage projects should I pursue next?",
    ],
  },
  {
    type: "legal_government",
    name: "Legal & Compliance Coach",
    tagline: "Passports, state IDs, legal contracts, estate planning, compliance audit",
    icon: "Scale",
    color: "#6366f1",
    bgGradient: "from-indigo-500/10 via-indigo-500/5 to-transparent",
    categoryKeys: ["legal_government"],
    disclaimer: "Document organization and deadline tracking. Not formal legal counsel or attorney representation.",
    welcomeMessage: "Welcome. I am your Legal & Compliance Coach. I track your critical identity documents, passports, contracts, driver's licenses, and estate documents so you never face expiration surprises or missing paperwork. What legal record needs review?",
    suggestedQuestions: [
      "Scan my vault for passports or state IDs expiring within the next 9 months.",
      "What documents belong in a comprehensive personal legal estate packet?",
      "Help me prepare an inventory checklist of all signed contracts and leases.",
      "What is the standard procedure and timeline for international passport renewal?",
    ],
  },
  {
    type: "family_relationships",
    name: "Family & Relationships Coach",
    tagline: "Emergency contacts, family milestones, communication rhythms, shared history",
    icon: "Users",
    color: "#ec4899",
    bgGradient: "from-pink-500/10 via-pink-500/5 to-transparent",
    categoryKeys: ["family_relationships"],
    disclaimer: "Supportive family systems and communication habits. Not marital or psychological counseling.",
    welcomeMessage: "Hello! I'm your Family & Relationships Coach. I help you nurture meaningful bonds, remember birthdays and milestones, maintain up-to-date emergency contact trees, and organize family memories. How can we strengthen your relationship circle today?",
    suggestedQuestions: [
      "Help me draft a comprehensive Family Emergency Contacts Protocol.",
      "Which family birthdays or anniversaries are coming up this month?",
      "Suggest thoughtful, intentional ways to maintain touch with distant loved ones.",
      "What vital family records or pet medical logs should we document?",
    ],
  },
  {
    type: "property_assets",
    name: "Property & Assets Coach",
    tagline: "Home deeds, vehicle maintenance schedules, equipment warranties, depreciation",
    icon: "Home",
    color: "#f59e0b",
    bgGradient: "from-amber-500/10 via-amber-500/5 to-transparent",
    categoryKeys: ["property_assets"],
    disclaimer: "Property management organization. Not licensed property inspection or financial appraisal.",
    welcomeMessage: "Welcome! I'm your Property & Assets Coach. I safeguard your real estate deeds, vehicle registrations, warranty receipts, and routine maintenance schedules to preserve and grow your asset value. What property or asset shall we review?",
    suggestedQuestions: [
      "Generate a seasonal maintenance checklist for my home or apartment.",
      "What documents and maintenance logs should I keep for my vehicle?",
      "Audit my recorded asset warranties and flag any expiring soon.",
      "Help me prepare a high-value physical asset inventory for insurance purposes.",
    ],
  },
  {
    type: "travel_experiences",
    name: "Travel & Expeditions Coach",
    tagline: "Expedition logistics, visa requirements, itinerary pacing, travel budget",
    icon: "Plane",
    color: "#06b6d4",
    bgGradient: "from-cyan-500/10 via-cyan-500/5 to-transparent",
    categoryKeys: ["travel_experiences"],
    disclaimer: "Travel planning and logistical advice. Verify foreign entry requirements with official consulates.",
    welcomeMessage: "Pack your bags! I'm your Travel & Expeditions Coach. I help you design unforgettable itineraries, verify passport validity and visa requirements, optimize travel budgets, and build bulletproof packing protocols. Where are we heading next?",
    suggestedQuestions: [
      "Check visa and entry rules for an upcoming international trip.",
      "Design an efficient 7-day itinerary balancing cultural immersion and rest.",
      "Create an essential international travel packing and document checklist.",
      "How can I optimize travel expenses and airline loyalty points for my next trip?",
    ],
  },
  {
    type: "hobbies_skills",
    name: "Hobbies & Skills Coach",
    tagline: "Deliberate practice routines, creative portfolios, hobby monetization",
    icon: "Palette",
    color: "#d946ef",
    bgGradient: "from-fuchsia-500/10 via-fuchsia-500/5 to-transparent",
    categoryKeys: ["hobbies_skills"],
    disclaimer: "Creative strategy and deliberate practice planning. Income depends on market execution.",
    welcomeMessage: "Greetings! I'm your Creative & Skills Mastery Coach. Whether it's photography, coding, music, or craftwork, I help you build disciplined practice routines, overcome creative blocks, and monetize your work. What creative endeavor are we exploring?",
    suggestedQuestions: [
      "Build a realistic 4-day deliberate practice routine for my creative craft.",
      "How can I package and monetize my hobby skills into a digital product or service?",
      "Help me overcome creative burnout and structure my next creative project.",
      "What should be included in an eye-catching creative portfolio?",
    ],
  },
  {
    type: "insurance_protection",
    name: "Insurance & Protection Coach",
    tagline: "Policy coverage audits, renewal calendar, deductible strategy, claims prep",
    icon: "ShieldCheck",
    color: "#14b8a6",
    bgGradient: "from-teal-500/10 via-teal-500/5 to-transparent",
    categoryKeys: ["insurance_protection"],
    disclaimer: "Educational policy organization. Always consult a licensed insurance broker for binding policy changes.",
    welcomeMessage: "Welcome! I'm your Insurance & Protection Coach. I keep your health, auto, home, and life policies organized, monitor upcoming renewals, assess coverage gaps, and guide you through claims documentation. Let's make sure you're protected.",
    suggestedQuestions: [
      "Audit my recorded insurance policies for coverage gaps or overlaps.",
      "When are my next policy renewals due and when should I shop quotes?",
      "What step-by-step documentation is required when filing an insurance claim?",
      "Explain the trade-offs between higher deductibles vs lower monthly premiums.",
    ],
  },
  {
    type: "daily_personal",
    name: "Daily Life & Personal Coach",
    tagline: "Atomic habit formation, daily routines, energy management, reflective journaling",
    icon: "Sun",
    color: "#f97316",
    bgGradient: "from-orange-500/10 via-orange-500/5 to-transparent",
    categoryKeys: ["daily_personal"],
    disclaimer: "Personal productivity and habit guidance. Not psychological therapy.",
    welcomeMessage: "Good day! I'm your Daily Life & Habit Coach. Based on atomic habit architecture, I help you build effortless morning/evening routines, sustain streaks, reflect through journaling, and align daily actions with your biggest life visions. What habit shall we conquer today?",
    suggestedQuestions: [
      "Design a frictionless 20-minute morning routine tailored to high focus.",
      "Give me a deep, reflective journaling prompt for today's entry.",
      "How can I break a stubborn procrastination habit using habit stacking?",
      "Help me conduct an honest weekly review of my energy and habit consistency.",
    ],
  },
  {
    type: "unified",
    name: "Unified AI Life Coach",
    tagline: "Master Life OS intelligence synthesizing all 11 categories, vault, and goals",
    icon: "Brain",
    color: "#6366f1",
    bgGradient: "from-indigo-500/10 via-purple-500/5 to-transparent",
    categoryKeys: DOMAINS.map((d) => d.key),
    disclaimer: "Your central AI life operating intelligence with cross-category synthesis.",
    welcomeMessage: "Hello! I am your Unified Master AI Life Coach. I have an interconnected, holistic view across all 11 life domains: Health, Finances, Education, Career, Legal, Family, Property, Travel, Hobbies, Insurance, and Daily Habits. Ask me anything, or jump into a dedicated category coach.",
    suggestedQuestions: [
      "Generate my comprehensive Daily Life Briefing across all 11 categories.",
      "Which life areas have the most urgent deadlines or need attention this week?",
      "Analyze the correlation between my daily habits and my financial/career progress.",
      "Scan my entire document vault and highlight missing or expiring items.",
    ],
  },
];

export const AI_COACH_MAP: Record<string, AICoachMeta> = Object.fromEntries(
  AI_COACHES.map((c) => [c.type, c]),
);

// Backward compatible aliases mapping legacy coach types to the 11 category coaches
const COACH_ALIASES: Record<string, string> = {
  health: "health_wellness",
  finance: "financial_money",
  wealth: "financial_money",
  education: "education_learning",
  growth: "education_learning",
  career: "career_work",
  legal: "legal_government",
  admin: "legal_government",
  family: "family_relationships",
  network: "family_relationships",
  property: "property_assets",
  travel: "travel_experiences",
  hobby: "hobbies_skills",
  creativity: "hobbies_skills",
  insurance: "insurance_protection",
  daily: "daily_personal",
  life: "daily_personal",
  mind_soul: "daily_personal",
  time_action: "daily_personal",
  predictive: "legal_government",
};

Object.entries(COACH_ALIASES).forEach(([alias, modern]) => {
  if (AI_COACH_MAP[modern]) {
    AI_COACH_MAP[alias] = AI_COACH_MAP[modern];
  }
});

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
