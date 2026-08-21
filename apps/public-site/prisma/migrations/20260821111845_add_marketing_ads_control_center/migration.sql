-- CreateEnum
CREATE TYPE "AdPlatform" AS ENUM ('GOOGLE_ADS', 'META_ADS', 'LINKEDIN_ADS', 'TIKTOK_ADS');

-- CreateEnum
CREATE TYPE "AdCampaignStatus" AS ENUM ('DRAFT', 'ACTIVE', 'PAUSED', 'COMPLETED', 'ARCHIVED');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "IntegrationType" ADD VALUE 'GOOGLE_ADS';
ALTER TYPE "IntegrationType" ADD VALUE 'META_ADS';
ALTER TYPE "IntegrationType" ADD VALUE 'LINKEDIN_ADS';
ALTER TYPE "IntegrationType" ADD VALUE 'TIKTOK_ADS';

-- AlterTable
ALTER TABLE "Enquiry" ADD COLUMN     "fbclid" TEXT,
ADD COLUMN     "gclid" TEXT,
ADD COLUMN     "ttclid" TEXT;

-- CreateTable
CREATE TABLE "AdCampaign" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "platform" "AdPlatform" NOT NULL,
    "market" TEXT NOT NULL,
    "officeId" TEXT,
    "name" TEXT NOT NULL,
    "status" "AdCampaignStatus" NOT NULL DEFAULT 'DRAFT',
    "campaignType" TEXT,
    "externalCampaignId" TEXT,
    "landingPageId" TEXT,
    "contentCampaignId" TEXT,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "budgetAmount" DOUBLE PRECISION,
    "budgetCurrency" TEXT,
    "budgetType" TEXT,
    "conversionReference" TEXT,
    "utmSource" TEXT,
    "utmMedium" TEXT,
    "utmCampaign" TEXT,
    "utmContent" TEXT,
    "utmTerm" TEXT,
    "notes" TEXT,
    "lastSyncedAt" TIMESTAMP(3),
    "lastSyncError" TEXT,
    "spend" DOUBLE PRECISION,
    "impressions" INTEGER,
    "clicks" INTEGER,
    "conversions" DOUBLE PRECISION,
    "conversionValue" DOUBLE PRECISION,
    "metricsCurrency" TEXT,
    "createdById" TEXT NOT NULL,

    CONSTRAINT "AdCampaign_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AdCampaign_platform_idx" ON "AdCampaign"("platform");

-- CreateIndex
CREATE INDEX "AdCampaign_status_idx" ON "AdCampaign"("status");

-- CreateIndex
CREATE INDEX "AdCampaign_officeId_idx" ON "AdCampaign"("officeId");

-- CreateIndex
CREATE INDEX "AdCampaign_contentCampaignId_idx" ON "AdCampaign"("contentCampaignId");

-- CreateIndex
CREATE INDEX "AdCampaign_landingPageId_idx" ON "AdCampaign"("landingPageId");

-- AddForeignKey
ALTER TABLE "AdCampaign" ADD CONSTRAINT "AdCampaign_officeId_fkey" FOREIGN KEY ("officeId") REFERENCES "Office"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdCampaign" ADD CONSTRAINT "AdCampaign_landingPageId_fkey" FOREIGN KEY ("landingPageId") REFERENCES "LandingPage"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdCampaign" ADD CONSTRAINT "AdCampaign_contentCampaignId_fkey" FOREIGN KEY ("contentCampaignId") REFERENCES "Campaign"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdCampaign" ADD CONSTRAINT "AdCampaign_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

