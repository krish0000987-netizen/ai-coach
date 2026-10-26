// AI Life Coach — comprehensive seed script
// Seeds all 11 life domains, sample documents, items, predictive reminders, and AI coach history.
import { PrismaClient } from "@prisma/client";
import { DOMAINS } from "./constants";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

function daysFromNow(n: number, h = 9, m = 0) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  d.setHours(h, m, 0, 0);
  return d;
}

export async function seedDatabase(targetUserId?: string) {
  console.log("🌱 Seeding AI Life Coach database in Supabase…");

  // 1. Seed or update all 11 Domains
  for (const dom of DOMAINS) {
    await db.domain.upsert({
      where: { key: dom.key },
      update: {
        name: dom.name,
        description: dom.description,
        icon: dom.icon,
        color: dom.color,
        order: dom.order,
      },
      create: {
        key: dom.key,
        name: dom.name,
        description: dom.description,
        icon: dom.icon,
        color: dom.color,
        order: dom.order,
      },
    });
  }

  // Also ensure legacy domain keys map to valid domain records for backward compatibility
  const legacyMap: Record<string, string> = {
    health: "health_wellness",
    wealth: "financial_money",
    growth: "education_learning",
    network: "family_relationships",
    creativity: "hobbies_skills",
    admin: "legal_government",
    mind_soul: "daily_personal",
    time_action: "daily_personal",
  };

  for (const [legacyKey, modernKey] of Object.entries(legacyMap)) {
    const modern = await db.domain.findUnique({ where: { key: modernKey } });
    if (modern) {
      await db.domain.upsert({
        where: { key: legacyKey },
        update: {},
        create: {
          key: legacyKey,
          name: modern.name,
          description: modern.description,
          icon: modern.icon,
          color: modern.color,
          order: 90,
        },
      });
    }
  }

  const allDomains = await db.domain.findMany();
  const dmap = Object.fromEntries(allDomains.map((d) => [d.key, d.id]));

  // 2. Ensure a default Demo User exists
  let demoUser = await db.user.findFirst({ where: { email: "demo@lifecoach.ai" } });
  if (!demoUser) {
    const passwordHash = await bcrypt.hash("demo123456", 10);
    demoUser = await db.user.create({
      data: {
        id: "demo-user-life-coach-01",
        email: "demo@lifecoach.ai",
        name: "Alex Morgan",
        passwordHash,
      },
    });
  }

  const userId = targetUserId || demoUser.id;

  // 3. Seed Projects
  const projects = [
    {
      name: "Health & Vitality 2026",
      description: "Comprehensive wellness: strength training, sleep tracking, and preventative care.",
      color: "#ef4444",
      icon: "HeartPulse",
      domainId: dmap.health_wellness || dmap.health,
      userId,
      status: "active",
      progress: 60,
      targetDate: daysFromNow(180),
    },
    {
      name: "Financial Freedom & House Fund",
      description: "Build 6-month emergency reserve and save for down payment.",
      color: "#10b981",
      icon: "Wallet",
      domainId: dmap.financial_money || dmap.wealth,
      userId,
      status: "active",
      progress: 45,
      targetDate: daysFromNow(240),
    },
    {
      name: "Senior Software Architect Career Path",
      description: "Certifications, portfolio projects, and leadership milestones.",
      color: "#8b5cf6",
      icon: "Briefcase",
      domainId: dmap.career_work,
      userId,
      status: "active",
      progress: 70,
      targetDate: daysFromNow(120),
    },
    {
      name: "European Alps Adventure",
      description: "Two-week hiking and photography trip in Switzerland & Italy.",
      color: "#06b6d4",
      icon: "Plane",
      domainId: dmap.travel_experiences,
      userId,
      status: "active",
      progress: 30,
      targetDate: daysFromNow(90),
    },
    {
      name: "Landscape Photography Portfolio",
      description: "Build professional gallery and launch fine art print shop.",
      color: "#d946ef",
      icon: "Palette",
      domainId: dmap.hobbies_skills,
      userId,
      status: "active",
      progress: 40,
      targetDate: daysFromNow(150),
    },
  ];

  const pmap: Record<string, string> = {};
  for (const p of projects) {
    const existing = await db.project.findFirst({ where: { name: p.name, userId } });
    if (!existing) {
      const created = await db.project.create({ data: p as any });
      pmap[p.name] = created.id;
    } else {
      pmap[p.name] = existing.id;
    }
  }

  // 4. Seed Representative Items across all 11 Categories
  const sampleItems = [
    // 1. Health & Wellness
    {
      type: "document",
      title: "Blood Test Results",
      content: "Uploaded blood test reports filed under Health category. Contains full blood panel results.",
      domainId: dmap.health_wellness,
      userId,
      status: "active",
      metadata: {
        attachments: [
          { name: "Blood Test Report 1", url: "#", size: 1024 * 512, type: "application/pdf" },
          { name: "Blood Test Report 2", url: "#", size: 1024 * 384, type: "application/pdf" },
        ],
      },
    },
    {
      type: "document",
      title: "Blood report summary",
      content: "Comprehensive metabolic panel, lipid profile, and vitamin D levels checked. All metrics optimal.",
      domainId: dmap.health_wellness,
      userId,
      status: "active",
      metadata: {
        attachments: [
          { name: "Full Panel Lab Results", url: "#", size: 1024 * 720, type: "application/pdf" },
        ],
      },
    },
    {
      type: "milestone",
      title: "Annual Physical & Comprehensive Blood Panel",
      content: "Complete metabolic panel, lipid profile, and vitamin D levels checked. All metrics optimal.",
      domainId: dmap.health_wellness,
      userId,
      status: "done",
      completedAt: daysFromNow(-30),
      metadata: { doctor: "Dr. Kathryn Vance", clinic: "Pacific Health Center" },
    },
    {
      type: "habit",
      title: "Daily Morning Mobility & 8k Steps",
      content: "15 min stretch routine and daily walking goal.",
      domainId: dmap.health_wellness,
      projectId: pmap["Health & Vitality 2026"],
      userId,
      status: "active",
      metadata: { streak: 14, target: 8000, unit: "steps" },
    },
    {
      type: "medication",
      title: "Vitamin D3 + K2 & Omega-3 Fish Oil",
      content: "Daily morning supplement with breakfast.",
      domainId: dmap.health_wellness,
      userId,
      status: "active",
      metadata: { dosage: "5000 IU + 2000mg", timing: "Morning" },
    },

    // 2. Financial & Money
    {
      type: "finance",
      title: "Monthly Salary / Consulting Income",
      domainId: dmap.financial_money,
      userId,
      status: "active",
      dueDate: daysFromNow(7),
      metadata: { kind: "income", amount: 7500, recurring: "monthly" },
    },
    {
      type: "finance",
      title: "Emergency Fund Milestone ($25,000)",
      domainId: dmap.financial_money,
      projectId: pmap["Financial Freedom & House Fund"],
      userId,
      status: "active",
      metadata: { kind: "goal", amount: 25000, current: 18500 },
    },
    {
      type: "finance",
      title: "Monthly Rent & Utilities",
      domainId: dmap.financial_money,
      userId,
      status: "active",
      dueDate: daysFromNow(5),
      metadata: { kind: "expense", amount: 2100, recurring: "monthly" },
    },

    // 3. Education & Learning
    {
      type: "milestone",
      title: "B.S. in Computer Science - Honors",
      content: "Graduated with Magna Cum Laude honors. Core coursework in distributed systems and algorithms.",
      domainId: dmap.education_learning,
      userId,
      status: "done",
      completedAt: new Date("2021-05-15"),
      metadata: { institution: "University of Washington", degree: "Bachelor of Science" },
    },
    {
      type: "goal",
      title: "AWS Certified Solutions Architect Professional",
      content: "Complete Cloud Academy prep course and practice exams.",
      domainId: dmap.education_learning,
      projectId: pmap["Senior Software Architect Career Path"],
      userId,
      status: "active",
      dueDate: daysFromNow(45),
    },

    // 4. Career & Work
    {
      type: "milestone",
      title: "Promoted to Lead Systems Engineer",
      content: "Led the cloud migration architecture for 3 core services.",
      domainId: dmap.career_work,
      userId,
      status: "done",
      completedAt: new Date("2024-02-01"),
      metadata: { company: "NextGen Technologies", impact: "Reduced cloud costs by 32%" },
    },
    {
      type: "task",
      title: "Update Executive Resume & Portfolio Case Studies",
      content: "Include quantified achievements and new distributed architecture wins.",
      domainId: dmap.career_work,
      projectId: pmap["Senior Software Architect Career Path"],
      userId,
      status: "active",
      priority: 3,
      dueDate: daysFromNow(14),
    },

    // 5. Legal & Government
    {
      type: "milestone",
      title: "Passport Renewal Due",
      content: "US Passport expires in 6 months. Renewal takes 8-11 weeks.",
      domainId: dmap.legal_government,
      userId,
      status: "active",
      dueDate: daysFromNow(180),
      metadata: { documentNumber: "US-P-984421", expiry: daysFromNow(180).toISOString() },
    },
    {
      type: "milestone",
      title: "Executed Living Will & Healthcare Proxy",
      content: "Signed with estate attorney; copy stored in Vault.",
      domainId: dmap.legal_government,
      userId,
      status: "done",
      completedAt: new Date("2025-01-10"),
    },

    // 6. Family & Relationships
    {
      type: "note",
      title: "Manjari Sethi",
      content: "Married in 2010. Met through sister Sanah's college friend. Previously divorced, Shiv was upset before meeting Manjari.",
      domainId: dmap.family_relationships,
      userId,
      status: "active",
    },
    {
      type: "note",
      title: "Aryen & Vhan Sethi",
      content: "Twin boys.",
      domainId: dmap.family_relationships,
      userId,
      status: "active",
    },
    {
      type: "note",
      title: "Dhruv Sethi",
      content: "Age 44. Handles production side of Radium Creation. Owns 11% shares. Dependent on father for salary.",
      domainId: dmap.family_relationships,
      userId,
      status: "active",
    },
    {
      type: "note",
      title: "Sanah Sethi",
      content: "Sister. Introduced Manjari through college friends network.",
      domainId: dmap.family_relationships,
      userId,
      status: "active",
    },
    {
      type: "contact",
      title: "Elena Morgan (Spouse)",
      content: "Emergency contact, shared beneficiaries on insurance and accounts.",
      domainId: dmap.family_relationships,
      userId,
      status: "active",
      metadata: { relationship: "Spouse", phone: "+1 (555) 234-5678", anniversary: "2022-09-18" },
    },
    {
      type: "event",
      title: "Wedding Anniversary Celebration",
      domainId: dmap.family_relationships,
      userId,
      status: "active",
      scheduledAt: daysFromNow(45),
    },

    // 7. Property & Assets
    {
      type: "milestone",
      title: "Vehicle Registration & Title (Tesla Model Y)",
      content: "VIN: 5YJYGDEE8NF000000. Insurance active with State Farm.",
      domainId: dmap.property_assets,
      userId,
      status: "active",
      dueDate: daysFromNow(60),
    },
    {
      type: "task",
      title: "HVAC Semi-Annual Filter Replacement & Service",
      domainId: dmap.property_assets,
      userId,
      status: "active",
      dueDate: daysFromNow(20),
    },

    // 8. Travel & Experiences
    {
      type: "event",
      title: "Flight to Zurich (Swiss Alps Trek)",
      content: "Flight LX039 confirmed. Booking ref: W78XYZ.",
      domainId: dmap.travel_experiences,
      projectId: pmap["European Alps Adventure"],
      userId,
      status: "active",
      scheduledAt: daysFromNow(90),
    },
    {
      type: "idea",
      title: "Bucket List: Northern Lights in Tromsø, Norway",
      domainId: dmap.travel_experiences,
      userId,
      status: "inbox",
    },

    // 9. Hobbies & Skills
    {
      type: "habit",
      title: "Golden Hour Photo Shoot & Light Editing",
      domainId: dmap.hobbies_skills,
      projectId: pmap["Landscape Photography Portfolio"],
      userId,
      status: "active",
      metadata: { cadence: "weekly", streak: 8 },
    },
    {
      type: "goal",
      title: "Launch Fine Art Print Shop ($500/mo goal)",
      domainId: dmap.hobbies_skills,
      projectId: pmap["Landscape Photography Portfolio"],
      userId,
      status: "active",
      dueDate: daysFromNow(60),
    },

    // 10. Insurance & Protection
    {
      type: "finance",
      title: "Comprehensive Health & Dental Insurance Policy",
      content: "BlueCross PPO Plan. Policy #BC-8899201. Annual deductible met.",
      domainId: dmap.insurance_protection,
      userId,
      status: "active",
      dueDate: daysFromNow(210),
      metadata: { policyType: "Health PPO", provider: "BlueCross", annualPremium: 4800 },
    },
    {
      type: "finance",
      title: "Auto & Umbrella Liability Insurance Renewal",
      content: "Policy #SF-992014. Premium due for semi-annual renewal.",
      domainId: dmap.insurance_protection,
      userId,
      status: "active",
      dueDate: daysFromNow(28),
      metadata: { policyType: "Auto & Umbrella", provider: "State Farm", premium: 720 },
    },

    // 11. Daily Life & Personal
    {
      type: "journal",
      title: "Clarity on balance and deliberate living",
      content: `Today felt deeply focused. Completed the system architecture document and got out for an 8k run. 
Grateful for quiet mornings, good coffee, and having a single source of truth for all my life records.`,
      domainId: dmap.daily_personal,
      userId,
      status: "active",
      scheduledAt: daysFromNow(-1, 20),
    },
    {
      type: "routine",
      title: "Evening Digital Shutdown & Reading Routine",
      content: "Screen off at 10 PM. 20 pages of reading, 5 minutes of gratitude reflection.",
      domainId: dmap.daily_personal,
      userId,
      status: "active",
    },
  ];

  for (const itemData of sampleItems) {
    const existing = await db.item.findFirst({
      where: { title: itemData.title, userId },
    });
    if (!existing) {
      const { metadata, ...rest } = itemData;
      await db.item.create({
        data: {
          ...rest,
          metadata: metadata ? JSON.stringify(metadata) : null,
        } as any,
      });
    }
  }

  // 5. Seed Verified Documents in Document Vault
  const sampleDocuments = [
    {
      title: "Passport - United States of America",
      description: "Official biometric passport. Renewal recommended 6 months before expiry.",
      category: "legal_government",
      documentType: "passport",
      fileName: "Passport_Alex_Morgan.pdf",
      fileSize: 1420500,
      mimeType: "application/pdf",
      storagePath: `${userId}/demo/Passport_Alex_Morgan.pdf`,
      issueDate: new Date("2016-08-10"),
      expiryDate: daysFromNow(180),
      tags: "passport,identification,travel,official",
      extractedText: "PASSPORT / PASSEPORT / PASAPORTE. UNITED STATES OF AMERICA. SURNAME: MORGAN. GIVEN NAMES: ALEX. NATIONALITY: UNITED STATES OF AMERICA. PASSPORT NO: 984421001. EXPIRATION DATE: 10 AUG 2026.",
      extractionStatus: "completed",
    },
    {
      title: "Comprehensive Health Panel & Lab Results",
      description: "Annual preventative lab screen by Pacific Health Center. Cholesterol, HbA1c, Vitamin D.",
      category: "health_wellness",
      documentType: "medical_report",
      fileName: "Annual_Lab_Panel_2025.pdf",
      fileSize: 840200,
      mimeType: "application/pdf",
      storagePath: `${userId}/demo/Annual_Lab_Panel_2025.pdf`,
      issueDate: daysFromNow(-30),
      expiryDate: daysFromNow(335), // Due again in a year
      tags: "health,bloodwork,lab_results,preventative",
      extractedText: "PACIFIC HEALTH CENTER - LABORATORY REPORT. PATIENT: ALEX MORGAN. TEST DATE: 2025-09-20. Total Cholesterol: 178 mg/dL (Desirable). Fasting Blood Glucose: 86 mg/dL. Vitamin D: 52 ng/mL (Optimal). ALL PARAMETERS WITHIN NORMAL LIMITS.",
      extractionStatus: "completed",
    },
    {
      title: "State Farm Auto & Umbrella Insurance Policy",
      description: "Comprehensive vehicle coverage and $1M umbrella liability policy schedule.",
      category: "insurance_protection",
      documentType: "auto_insurance_policy",
      fileName: "StateFarm_Policy_Schedule_2025.pdf",
      fileSize: 1105400,
      mimeType: "application/pdf",
      storagePath: `${userId}/demo/StateFarm_Policy_Schedule_2025.pdf`,
      issueDate: daysFromNow(-150),
      expiryDate: daysFromNow(28), // Expiration in 28 days!
      tags: "insurance,auto,umbrella,policy,renewal",
      extractedText: "STATE FARM INSURANCE POLICY DECLARATIONS. POLICYHOLDER: ALEX MORGAN. VEHICLE: 2023 TESLA MODEL Y. COVERAGE: COMPREHENSIVE & COLLISION $500 DEDUCTIBLE. UMBRELLA LIABILITY: $1,000,000. RENEWAL DATE: WITHIN 30 DAYS.",
      extractionStatus: "completed",
    },
    {
      title: "Residential Property Deed & Title Insurance",
      description: "Recorded warranty deed and title insurance policy for home.",
      category: "property_assets",
      documentType: "property_deed",
      fileName: "Warranty_Deed_Property_Title.pdf",
      fileSize: 2150000,
      mimeType: "application/pdf",
      storagePath: `${userId}/demo/Warranty_Deed_Property_Title.pdf`,
      issueDate: new Date("2023-04-12"),
      tags: "property,home,deed,real_estate,title",
      extractedText: "OFFICIAL RECORDS - STATUTORY WARRANTY DEED. RECORDED IN COUNTY RECORDER OFFICE. TITLE HOLDER: ALEX MORGAN & ELENA MORGAN. PARCEL ID: 449-012-990.",
      extractionStatus: "completed",
    },
    {
      title: "University of Washington Bachelor of Science Degree",
      description: "Official degree certificate in Computer Science with Honors.",
      category: "education_learning",
      documentType: "diploma_degree",
      fileName: "UW_BSc_Computer_Science_Degree.pdf",
      fileSize: 1850000,
      mimeType: "application/pdf",
      storagePath: `${userId}/demo/UW_BSc_Computer_Science_Degree.pdf`,
      issueDate: new Date("2021-05-15"),
      tags: "education,degree,university,diploma",
      extractedText: "BOARD OF REGENTS OF THE UNIVERSITY OF WASHINGTON. DEGREE OF BACHELOR OF SCIENCE IN COMPUTER SCIENCE CONFERRED UPON ALEX MORGAN WITH HONORS.",
      extractionStatus: "completed",
    },
    {
      title: "Executed Living Will and Medical Power of Attorney",
      description: "Legal estate document designating healthcare proxy and end-of-life directives.",
      category: "legal_government",
      documentType: "will_testament",
      fileName: "Living_Will_Healthcare_Proxy.pdf",
      fileSize: 920000,
      mimeType: "application/pdf",
      storagePath: `${userId}/demo/Living_Will_Healthcare_Proxy.pdf`,
      issueDate: new Date("2025-01-10"),
      tags: "legal,will,estate,power_of_attorney",
      extractedText: "ADVANCE HEALTHCARE DIRECTIVE AND MEDICAL POWER OF ATTORNEY. PRINCIPAL: ALEX MORGAN. APPOINTED AGENT: ELENA MORGAN. NOTARIZED BY STATE COMMISSIONER.",
      extractionStatus: "completed",
    },
  ];

  for (const doc of sampleDocuments) {
    const existing = await db.document.findFirst({
      where: { title: doc.title, userId },
    });
    if (!existing) {
      await db.document.create({
        data: {
          ...doc,
          userId,
        },
      });
    }
  }

  // 6. Seed Predictive Reminders
  const autoInsuranceDoc = await db.document.findFirst({
    where: { title: { contains: "State Farm" }, userId },
  });

  const passportDoc = await db.document.findFirst({
    where: { title: { contains: "Passport" }, userId },
  });

  const reminders = [
    {
      title: "Auto & Umbrella Insurance Policy Renewal in 28 Days",
      description: "Review current policy schedule and shop renewal rates before automatic renewal.",
      category: "insurance_protection",
      type: "renewal",
      remindAt: daysFromNow(1),
      dueDate: daysFromNow(28),
      documentId: autoInsuranceDoc?.id,
      userId,
    },
    {
      title: "Passport Expiration in 6 Months (Renewal Window Open)",
      description: "US Passport expires in August 2026. Submit renewal application now to avoid expediting fees.",
      category: "legal_government",
      type: "expiry",
      remindAt: daysFromNow(3),
      dueDate: daysFromNow(180),
      documentId: passportDoc?.id,
      userId,
    },
    {
      title: "Vehicle Registration & Annual Smog Check",
      description: "Tesla Model Y registration due with state DMV.",
      category: "property_assets",
      type: "expiry",
      remindAt: daysFromNow(14),
      dueDate: daysFromNow(60),
      userId,
    },
    {
      title: "Schedule Semi-Annual Dental Cleaning & Checkup",
      description: "6 months since last cleaning. Preventative dental is covered 100% by insurance.",
      category: "health_wellness",
      type: "health_check",
      remindAt: daysFromNow(5),
      userId,
    },
  ];

  for (const rem of reminders) {
    const existing = await db.reminder.findFirst({
      where: { title: rem.title, userId },
    });
    if (!existing) {
      await db.reminder.create({
        data: rem as any,
      });
    }
  }

  // 7. Seed Sample AI Coach Conversations
  const sampleConversation = await db.aICoachConversation.findFirst({
    where: { userId, coachType: "predictive" },
  });

  if (!sampleConversation) {
    const conv = await db.aICoachConversation.create({
      data: {
        userId,
        coachType: "predictive",
        title: "Upcoming Document Expiries & Insurance Audit",
      },
    });

    await db.aICoachMessage.createMany({
      data: [
        {
          conversationId: conv.id,
          role: "user",
          content: "What documents or policies are coming up for renewal soon?",
        },
        {
          conversationId: conv.id,
          role: "assistant",
          content: `### Predictive Life Audit & Expiry Analysis

Here is a summary of your upcoming deadlines synthesized across your verified vault records:

1. **Auto & Umbrella Insurance Policy (State Farm)**:
   - **Renewal Due**: In **28 days** (${daysFromNow(28).toLocaleDateString()})
   - **Action**: Check if your mileage tier has changed to save on premiums, or compare rates with bundled homeowner options.

2. **US Passport**:
   - **Expiry Date**: ${daysFromNow(180).toLocaleDateString()} (in 6 months)
   - **Action**: Most international airlines require at least 6 months validity. Your upcoming Swiss Alps trip is in 90 days, so start your renewal now to ensure smooth travel.

3. **Preventative Health**:
   - Your last comprehensive metabolic lab report was logged 30 days ago and is completely clean. Consider scheduling your dental checkup next month.

*Would you like me to draft an insurance review checklist or help set up a renewal task?*`,
        },
      ],
    });
  }

  console.log("✅ Database successfully seeded with 11 categories, documents, reminders, and coaching!");
}

if (require.main === module) {
  seedDatabase()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
