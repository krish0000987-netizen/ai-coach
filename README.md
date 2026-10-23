# AI Life Coach & Personal Operating System

An interconnected personal data vault, life-management operating system, and AI coaching platform that helps you organize your entire life — from birth certificates to wills — across 11 life categories, with 6 specialized AI coaches powered by OpenRouter.

Built upon the open-source **Life OS** architecture and extended into an end-to-end cloud platform with **Next.js 16 (App Router)**, **TypeScript**, **Tailwind CSS**, **Prisma ORM**, **Supabase PostgreSQL**, **Supabase Auth & Storage**, and **OpenRouter Free Model API**.

---

## 🌟 Key Capabilities

### 1. 🗄️ Personal Document Vault
- **Private Storage**: Stored in a private Supabase Storage bucket (`vault`) with strict user-level authorization and 1-hour signed URLs.
- **Client & Server Validation**: Enforces MIME-type filtering (PDF, PNG, JPG, WebP, DOCX, TXT) and a 50MB file size limit.
- **Text Extraction Pipeline**: Automatically extracts and indexes text from uploaded PDFs and notes for instant keyword search.
- **Predictive Expiry Detection**: Automatically calculates expiry dates (passports, driver's licenses, insurance policies, warranties) and creates proactive renewal reminders.

### 2. 🤖 6 Specialized AI Coaches + Unified Coach
Powered by OpenRouter with configurable models (defaulting to free models such as `openrouter/free` or `meta-llama/llama-3.3-70b-instruct:free`) and an instant **Free Demo Mode** when no API key is set:
1. **Health & Wellness Coach**: Medical records organization, lab test analysis preparation, vaccination tracking, and general wellness guidance. *(Strict safety disclaimer: never diagnoses conditions).*
2. **Financial & Money Coach**: Cash flow breakdown, subscription review, budgeting concepts, and savings progress grounded in your recorded data.
3. **Career & Work Coach**: CV enhancement, interview preparation, quantifiable achievement tracking, and skill gap roadmaps.
4. **Life & Mindset Coach**: Goal setting, habit consistency, weekly reviews, and reflective journaling prompts.
5. **Hobby & Creative Coach**: Creative routines, skill progression, portfolio planning, and practical hobby monetization ideas.
6. **Predictive Life Coach**: Cross-category synthesis, upcoming renewal audits, overdue milestones, and pattern analysis.
7. **Unified AI Life Coach**: Central coach with holistic access across all 11 categories.

### 3. 🌐 All 11 Life Categories
1. **Health & Wellness**: Medical reports, vaccinations, prescriptions, allergies, lab results, appointments, health metrics.
2. **Financial & Money**: Income, expenses, subscriptions, budgets, savings goals, bank statements, tax returns.
3. **Education & Learning**: Degrees, diplomas, certifications, courses, books, reading trackers, study plans.
4. **Career & Work**: Employment history, projects, achievements, qualifications, CVs, portfolios.
5. **Legal & Government**: Passports, driver's licenses, birth certificates, wills, living trusts, contracts.
6. **Family & Relationships**: Family members, anniversaries, emergency contacts, shared memories.
7. **Property & Assets**: Homes, deeds, vehicle titles, warranties, purchase receipts, maintenance schedules.
8. **Travel & Experiences**: Trips, flight bookings, hotel reservations, itineraries, bucket lists.
9. **Hobbies & Skills**: Creative work, photography, music, practice sessions, equipment specs, monetization.
10. **Insurance & Protection**: Health, auto, home, and life policies, coverage details, renewal dates, masked policy numbers.
11. **Daily Life & Personal**: Journals, daily moods, habits, routines, affirmations, reflections, life milestones.

### 4. ⏰ Predictive Alerts & Expiry Engine
- Deterministic date auditing:
  - Documents expiring in 30 days, 7 days, or expired.
  - Semi-annual and annual insurance policy renewals.
  - Preventative health checkups (alerts if no health update in 60+ days).
  - Overdue milestones and goals.
- Deduplication prevents repetitive duplicate reminders.
- One-click actions: Snooze (1d, 3d, 7d), Mark Complete, Dismiss, or Consult Predictive Coach.

### 5. 🗺️ Life Timeline & Knowledge Graph
- Chronological timeline tracking user milestones from user-entered dates across education, career, family, property, health, and travel.
- Visual force-directed Brain Graph showing bi-directional connections between all records.

### 6. 👨‍👩‍👧‍👦 Family Workspace & Selective Sharing
- Four access levels: **Owner**, **Administrator**, **Contributor**, and **Read-only Viewer**.
- Revocable invite tokens with expiration.
- **Privacy First**: Personal vault documents and private records are isolated by default; only explicitly designated items are shared with the family workspace.

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js 18+ or Bun
- A free [Supabase](https://supabase.com) account (PostgreSQL + Storage)
- (Optional) A free [OpenRouter](https://openrouter.ai) API key

### 2. Installation
```bash
git clone https://github.com/krish0000987-netizen/ai-coach.git
cd ai-coach
npm install
```

### 3. Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Fill in your Supabase credentials and optional OpenRouter key:
```env
DATABASE_URL="postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres"
DIRECT_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres"
SESSION_SECRET="your-super-secure-session-secret"

NEXT_PUBLIC_SUPABASE_URL="https://[PROJECT_REF].supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"

OPENROUTER_API_KEY="" # Optional for Demo Mode
OPENROUTER_MODEL="openrouter/free"
OPENROUTER_BASE_URL="https://openrouter.ai/api/v1"
```

### 4. Database Setup & Seeding
Apply migrations and seed sample records across all 11 categories:
```bash
npx prisma generate
node scripts/migrate-supabase.js
bun run src/lib/seed.ts
```

### 5. Start Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

Demo account credentials:
- **Email**: `demo@gmail.com`
- **Password**: `Password123`

---

## 🧪 Testing & Quality Assurance

Run the test and verification suite:

```bash
# 1. Type checking
npx tsc --noEmit

# 2. Linting
npm run lint

# 3. Comprehensive integration tests
node scripts/test-integration.js

# 4. Production build
npm run build
```

---

## ☁️ Deployment on Vercel

1. Connect your repository (`krish0000987-netizen/ai-coach`) on Vercel.
2. In **Project Settings → Environment Variables**, add:
   - `DATABASE_URL`
   - `DIRECT_URL`
   - `SESSION_SECRET`
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `OPENROUTER_API_KEY` (optional)
   - `OPENROUTER_MODEL` (e.g. `openrouter/free`)
3. Set the build command to:
   ```bash
   prisma generate && next build
   ```
4. Deploy!
