-- ScamCheck initial PostgreSQL schema for Supabase.
-- Run once in Supabase Dashboard > SQL Editor > New query.
-- Generated from prisma/schema.prisma. Do not run against a database that
-- already contains these tables unless you intentionally reset it first.

BEGIN;

CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "country" TEXT NOT NULL DEFAULT 'LK',
    "language" TEXT NOT NULL DEFAULT 'en',
    "role" TEXT NOT NULL DEFAULT 'USER',
    "timezone" TEXT NOT NULL DEFAULT 'Asia/Colombo',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "UserPreference" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "language" TEXT NOT NULL DEFAULT 'en',
    "deleteScreenshotsAfterScan" BOOLEAN NOT NULL DEFAULT true,
    "notificationsEnabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "UserPreference_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Scan" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "scanType" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'COMPLETED',
    "riskLevel" TEXT NOT NULL,
    "riskScore" INTEGER NOT NULL,
    "summary" TEXT NOT NULL,
    "language" TEXT NOT NULL DEFAULT 'en',
    "isSaved" BOOLEAN NOT NULL DEFAULT false,
    "claimedOrg" TEXT,
    "normalizedTarget" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Scan_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ScanInput" (
    "id" TEXT NOT NULL,
    "scanId" TEXT NOT NULL,
    "inputType" TEXT NOT NULL,
    "text" TEXT,
    "storageKey" TEXT,
    "mimeType" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ScanInput_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "RiskSignal" (
    "id" TEXT NOT NULL,
    "scanId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "confidence" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "evidence" TEXT,
    "source" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "RiskSignal_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CommunityReport" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "identifierType" TEXT NOT NULL,
    "identifierValueHash" TEXT NOT NULL,
    "displayValueMasked" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "platform" TEXT,
    "amountLost" DOUBLE PRECISION,
    "currency" TEXT NOT NULL DEFAULT 'LKR',
    "evidenceStorageKey" TEXT,
    "dateEncountered" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "moderatorNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "CommunityReport_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Brand" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "aliases" TEXT NOT NULL,
    "country" TEXT NOT NULL DEFAULT 'LK',
    "verificationStatus" TEXT NOT NULL DEFAULT 'VERIFIED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Brand_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "BrandDomain" (
    "id" TEXT NOT NULL,
    "brandId" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "official" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "BrandDomain_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ThreatIndicator" (
    "id" TEXT NOT NULL,
    "indicatorType" TEXT NOT NULL,
    "indicatorValueHash" TEXT NOT NULL,
    "displayValue" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "riskLevel" TEXT NOT NULL DEFAULT 'KNOWN_MALICIOUS',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ThreatIndicator_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "metadata" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ExternalLookupCache" (
    "id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "lookupHash" TEXT NOT NULL,
    "response" JSONB NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ExternalLookupCache_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE INDEX "User_email_idx" ON "User"("email");
CREATE UNIQUE INDEX "UserPreference_userId_key" ON "UserPreference"("userId");
CREATE INDEX "Scan_userId_idx" ON "Scan"("userId");
CREATE INDEX "Scan_riskLevel_idx" ON "Scan"("riskLevel");
CREATE INDEX "Scan_createdAt_idx" ON "Scan"("createdAt");
CREATE INDEX "ScanInput_scanId_idx" ON "ScanInput"("scanId");
CREATE INDEX "RiskSignal_scanId_idx" ON "RiskSignal"("scanId");
CREATE INDEX "CommunityReport_identifierValueHash_idx" ON "CommunityReport"("identifierValueHash");
CREATE INDEX "CommunityReport_status_idx" ON "CommunityReport"("status");
CREATE INDEX "CommunityReport_category_idx" ON "CommunityReport"("category");
CREATE INDEX "CommunityReport_createdAt_idx" ON "CommunityReport"("createdAt");
CREATE UNIQUE INDEX "Brand_name_key" ON "Brand"("name");
CREATE UNIQUE INDEX "BrandDomain_domain_key" ON "BrandDomain"("domain");
CREATE INDEX "BrandDomain_domain_idx" ON "BrandDomain"("domain");
CREATE INDEX "ThreatIndicator_indicatorValueHash_idx" ON "ThreatIndicator"("indicatorValueHash");
CREATE INDEX "ThreatIndicator_active_idx" ON "ThreatIndicator"("active");
CREATE INDEX "AuditLog_userId_idx" ON "AuditLog"("userId");
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");
CREATE UNIQUE INDEX "ExternalLookupCache_provider_lookupHash_key" ON "ExternalLookupCache"("provider", "lookupHash");
CREATE INDEX "ExternalLookupCache_expiresAt_idx" ON "ExternalLookupCache"("expiresAt");

ALTER TABLE "UserPreference" ADD CONSTRAINT "UserPreference_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Scan" ADD CONSTRAINT "Scan_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ScanInput" ADD CONSTRAINT "ScanInput_scanId_fkey"
  FOREIGN KEY ("scanId") REFERENCES "Scan"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RiskSignal" ADD CONSTRAINT "RiskSignal_scanId_fkey"
  FOREIGN KEY ("scanId") REFERENCES "Scan"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CommunityReport" ADD CONSTRAINT "CommunityReport_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "BrandDomain" ADD CONSTRAINT "BrandDomain_brandId_fkey"
  FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Production hardening additions (safe when applying to an existing database).
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "emailVerifiedAt" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "failedLoginAttempts" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "lockedUntil" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "lastLoginAt" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "twoFactorEnabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "twoFactorSecret" TEXT;
ALTER TABLE "Scan" ADD COLUMN IF NOT EXISTS "assessmentStatus" TEXT NOT NULL DEFAULT 'ASSESSED';
ALTER TABLE "Scan" ADD COLUMN IF NOT EXISTS "evidenceConfidence" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Scan" ADD COLUMN IF NOT EXISTS "modelVersion" TEXT NOT NULL DEFAULT 'scamcheck-risk-v1';
ALTER TABLE "Scan" ADD COLUMN IF NOT EXISTS "scoreProvenance" JSONB;

CREATE TABLE IF NOT EXISTS "ApiRateLimit" ("key" TEXT PRIMARY KEY, "count" INTEGER NOT NULL, "resetAt" TIMESTAMP(3) NOT NULL, "updatedAt" TIMESTAMP(3) NOT NULL);
CREATE INDEX IF NOT EXISTS "ApiRateLimit_resetAt_idx" ON "ApiRateLimit"("resetAt");
CREATE TABLE IF NOT EXISTS "AuthToken" ("id" TEXT PRIMARY KEY, "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE, "tokenHash" TEXT NOT NULL UNIQUE, "type" TEXT NOT NULL, "expiresAt" TIMESTAMP(3) NOT NULL, "usedAt" TIMESTAMP(3), "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE INDEX IF NOT EXISTS "AuthToken_userId_type_idx" ON "AuthToken"("userId", "type");
CREATE INDEX IF NOT EXISTS "AuthToken_expiresAt_idx" ON "AuthToken"("expiresAt");

COMMIT;
