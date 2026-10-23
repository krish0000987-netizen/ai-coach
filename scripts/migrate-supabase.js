const fs = require('fs');

async function migrate() {
  const token = process.env.SUPABASE_ACCESS_TOKEN;
  const projectRef = process.env.SUPABASE_PROJECT_REF || 'gnmrydmjcrsxxxroinqi';

  const sql = `
CREATE TABLE IF NOT EXISTS "User" (
  "id" TEXT PRIMARY KEY,
  "email" TEXT UNIQUE NOT NULL,
  "name" TEXT,
  "passwordHash" TEXT,
  "avatarUrl" TEXT,
  "totpSecret" TEXT,
  "totpVerified" BOOLEAN DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "Domain" (
  "id" TEXT PRIMARY KEY,
  "key" TEXT UNIQUE NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "icon" TEXT,
  "color" TEXT DEFAULT '#71717a',
  "accent" TEXT,
  "order" INTEGER DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "Project" (
  "id" TEXT PRIMARY KEY,
  "userId" TEXT,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "color" TEXT DEFAULT '#71717a',
  "icon" TEXT,
  "domainId" TEXT REFERENCES "Domain"("id") ON DELETE SET NULL,
  "status" TEXT DEFAULT 'active',
  "progress" INTEGER DEFAULT 0,
  "startDate" TIMESTAMP(3),
  "targetDate" TIMESTAMP(3),
  "completedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "Item" (
  "id" TEXT PRIMARY KEY,
  "userId" TEXT,
  "type" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "content" TEXT,
  "domainId" TEXT REFERENCES "Domain"("id") ON DELETE SET NULL,
  "projectId" TEXT REFERENCES "Project"("id") ON DELETE SET NULL,
  "status" TEXT DEFAULT 'active',
  "priority" INTEGER DEFAULT 0,
  "energy" INTEGER DEFAULT 0,
  "startDate" TIMESTAMP(3),
  "dueDate" TIMESTAMP(3),
  "scheduledAt" TIMESTAMP(3),
  "completedAt" TIMESTAMP(3),
  "metadata" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "Document" (
  "id" TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "category" TEXT NOT NULL,
  "documentType" TEXT NOT NULL,
  "fileName" TEXT NOT NULL,
  "fileSize" INTEGER NOT NULL,
  "mimeType" TEXT NOT NULL,
  "storagePath" TEXT NOT NULL,
  "issueDate" TIMESTAMP(3),
  "expiryDate" TIMESTAMP(3),
  "tags" TEXT,
  "notes" TEXT,
  "extractedText" TEXT,
  "extractionStatus" TEXT DEFAULT 'pending',
  "aiSummary" TEXT,
  "isSensitive" BOOLEAN DEFAULT true,
  "version" INTEGER DEFAULT 1,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "AICoachConversation" (
  "id" TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "coachType" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "AICoachMessage" (
  "id" TEXT PRIMARY KEY,
  "conversationId" TEXT NOT NULL REFERENCES "AICoachConversation"("id") ON DELETE CASCADE,
  "role" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "metadata" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "Reminder" (
  "id" TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "itemId" TEXT REFERENCES "Item"("id") ON DELETE CASCADE,
  "documentId" TEXT REFERENCES "Document"("id") ON DELETE CASCADE,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "category" TEXT,
  "type" TEXT DEFAULT 'expiry',
  "remindAt" TIMESTAMP(3) NOT NULL,
  "dueDate" TIMESTAMP(3),
  "status" TEXT DEFAULT 'pending',
  "sent" BOOLEAN DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "FamilyWorkspace" (
  "id" TEXT PRIMARY KEY,
  "name" TEXT NOT NULL,
  "ownerId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "FamilyMember" (
  "id" TEXT PRIMARY KEY,
  "workspaceId" TEXT NOT NULL REFERENCES "FamilyWorkspace"("id") ON DELETE CASCADE,
  "userId" TEXT,
  "email" TEXT NOT NULL,
  "role" TEXT DEFAULT 'viewer',
  "status" TEXT DEFAULT 'pending',
  "inviteToken" TEXT UNIQUE,
  "expiresAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "FamilySharedResource" (
  "id" TEXT PRIMARY KEY,
  "workspaceId" TEXT NOT NULL REFERENCES "FamilyWorkspace"("id") ON DELETE CASCADE,
  "resourceType" TEXT NOT NULL,
  "resourceId" TEXT NOT NULL,
  "sharedByUserId" TEXT NOT NULL,
  "canEdit" BOOLEAN DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "Link" (
  "id" TEXT PRIMARY KEY,
  "fromId" TEXT NOT NULL REFERENCES "Item"("id") ON DELETE CASCADE,
  "toId" TEXT NOT NULL REFERENCES "Item"("id") ON DELETE CASCADE,
  "type" TEXT DEFAULT 'related',
  "note" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "Tag" (
  "id" TEXT PRIMARY KEY,
  "name" TEXT UNIQUE NOT NULL,
  "color" TEXT DEFAULT '#71717a',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "TagOnItem" (
  "itemId" TEXT NOT NULL REFERENCES "Item"("id") ON DELETE CASCADE,
  "tagId" TEXT NOT NULL REFERENCES "Tag"("id") ON DELETE CASCADE,
  PRIMARY KEY ("itemId", "tagId")
);

CREATE TABLE IF NOT EXISTS "HabitLog" (
  "id" TEXT PRIMARY KEY,
  "itemId" TEXT NOT NULL REFERENCES "Item"("id") ON DELETE CASCADE,
  "date" TIMESTAMP(3) NOT NULL,
  "value" INTEGER DEFAULT 1,
  "note" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "HabitLog_itemId_date_key" UNIQUE ("itemId", "date")
);

CREATE TABLE IF NOT EXISTS "Review" (
  "id" TEXT PRIMARY KEY,
  "userId" TEXT,
  "type" TEXT NOT NULL,
  "date" TIMESTAMP(3) NOT NULL,
  "status" TEXT DEFAULT 'completed',
  "weekStart" TIMESTAMP(3),
  "weekEnd" TIMESTAMP(3),
  "wins" TEXT,
  "challenges" TEXT,
  "learnings" TEXT,
  "priorities" TEXT,
  "gratitude" TEXT,
  "mood" INTEGER,
  "energy" INTEGER,
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "ReviewItem" (
  "reviewId" TEXT NOT NULL REFERENCES "Review"("id") ON DELETE CASCADE,
  "itemId" TEXT NOT NULL REFERENCES "Item"("id") ON DELETE CASCADE,
  "note" TEXT,
  PRIMARY KEY ("reviewId", "itemId")
);

CREATE TABLE IF NOT EXISTS "Setting" (
  "id" TEXT PRIMARY KEY,
  "value" TEXT NOT NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS "Item_type_idx" ON "Item"("type");
CREATE INDEX IF NOT EXISTS "Item_status_idx" ON "Item"("status");
CREATE INDEX IF NOT EXISTS "Item_userId_idx" ON "Item"("userId");
CREATE INDEX IF NOT EXISTS "Item_domainId_idx" ON "Item"("domainId");
CREATE INDEX IF NOT EXISTS "Item_dueDate_idx" ON "Item"("dueDate");
CREATE INDEX IF NOT EXISTS "Document_userId_idx" ON "Document"("userId");
CREATE INDEX IF NOT EXISTS "Document_category_idx" ON "Document"("category");
CREATE INDEX IF NOT EXISTS "Document_expiryDate_idx" ON "Document"("expiryDate");
CREATE INDEX IF NOT EXISTS "Reminder_userId_idx" ON "Reminder"("userId");
CREATE INDEX IF NOT EXISTS "Reminder_remindAt_idx" ON "Reminder"("remindAt");
CREATE INDEX IF NOT EXISTS "AICoachConversation_userId_idx" ON "AICoachConversation"("userId");
`;

  const res = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/database/query`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query: sql })
  });

  const result = await res.json();
  console.log('Migration Result:', JSON.stringify(result));
}

migrate().catch(console.error);
