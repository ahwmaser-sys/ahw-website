-- CreateEnum
CREATE TYPE "OfficeStatus" AS ENUM ('ACTIVE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "LegalPageType" AS ENUM ('PRIVACY_POLICY', 'TERMS_OF_SERVICE', 'COOKIE_POLICY', 'DATA_DELETION');

-- CreateTable: Office (created before any FK that references it)
CREATE TABLE "Office" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "isHeadquarters" BOOLEAN NOT NULL DEFAULT false,
    "status" "OfficeStatus" NOT NULL DEFAULT 'ACTIVE',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "addressFull" TEXT NOT NULL,
    "addressStreet" TEXT,
    "addressBuilding" TEXT,
    "mapLink" TEXT,
    "mapEmbedUrl" TEXT,
    "phones" TEXT[],
    "emails" TEXT[],
    "website" TEXT,
    "workingHours" TEXT,
    "timezone" TEXT,
    "defaultLanguage" TEXT NOT NULL DEFAULT 'en',
    "googleBusinessProfileUrl" TEXT,
    "socialLinks" JSONB,
    "ctaLabel" TEXT,
    "ctaUrl" TEXT,
    "brandOverride" JSONB,
    "logoOverrideId" TEXT,
    "qrCodeAssetId" TEXT,

    CONSTRAINT "Office_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Office_slug_key" ON "Office"("slug");

-- CreateIndex
CREATE INDEX "Office_status_idx" ON "Office"("status");

-- Seed the two real offices from packages/ui-components/data/offices.ts
-- (this migration is the one-time move of that data from a static file
-- into the database it now lives in — see lib/portal/offices.ts).
INSERT INTO "Office" (
  "id", "updatedAt", "name", "slug", "country", "city", "isHeadquarters", "sortOrder",
  "addressFull", "addressStreet", "addressBuilding", "mapLink", "mapEmbedUrl",
  "phones", "emails", "workingHours", "timezone", "defaultLanguage",
  "socialLinks", "ctaLabel", "ctaUrl"
) VALUES
(
  'office-kuwait-hq', CURRENT_TIMESTAMP, 'Kuwait Head Office', 'kuwait', 'Kuwait', 'Kuwait City', true, 0,
  'Pearl Tower, Floor 12, Office 2, Ali Salem St, Al Qibla, Kuwait City', 'Ali Salem St, Al Qibla', 'Pearl Tower, Floor 12, Office 2',
  'https://maps.app.goo.gl/4Zcah7Mm6XGAcuLD9',
  'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d111246.5168051662!2d47.93582455964893!3d29.38722889218684!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3fcf9c83ce455983%3A0xc3ebaef5af09b90e!2sKuwait%20City%2C%20Kuwait!5e0!3m2!1sen!2s!4v1707914000000!5m2!1sen!2s',
  ARRAY['+965 22455723', '+965 99194300'],
  ARRAY['wardany@ahwarchitects.com', 'info@ahwarchitects.com'],
  'Sunday - Thursday: 9:00 AM - 5:00 PM', 'Asia/Kuwait', 'en',
  '{"instagram":"https://www.instagram.com/ahw_architects","facebook":"https://facebook.com/ahwarchitects","linkedin":"https://www.linkedin.com/company/ahw-architects-d-b-projects","whatsapp":"+96522285382","bookingUrl":"https://calendar.google.com/"}',
  'Start Your Project', 'https://ahwspaces.com/contact'
),
(
  'office-egypt', CURRENT_TIMESTAMP, 'Egypt Office', 'egypt', 'Egypt', 'Cairo', false, 1,
  'Ryhana Plaza Tower A, Floor 9, Office 2, Zahraa Al Maadi, Cairo', 'Zahraa Al Maadi', 'Ryhana Plaza Tower, Floor 9',
  'https://maps.app.goo.gl/tNTd513KXXBnGp2BA?g_st=ic',
  'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d110502.60389552706!2d31.258464350000004!3d30.059618499999996!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x14583fa60b21beeb%3A0x79dfb296e8423bba!2sCairo%2C%20Cairo%20Governorate%2C%20Egypt!5e0!3m2!1sen!2s!4v1707914000000!5m2!1sen!2s',
  ARRAY['+20 1 0040 09496', '+20 2 2519 9290'],
  ARRAY['mwardany@ahwarchitects.com', 'info@ahwarchitects.com'],
  'Sunday - Thursday: 9:00 AM - 5:00 PM', 'Africa/Cairo', 'en',
  '{"instagram":"https://www.instagram.com/ahw_masr","facebook":"https://facebook.com/ahwmasr","linkedin":"https://www.linkedin.com/company/ahw-architects-masr","whatsapp":"+201000910227","bookingUrl":"https://calendar.google.com/"}',
  'Start Your Project', 'https://ahwspaces.com/contact'
);

-- AlterTable: add officeId nullable first so existing rows can be
-- backfilled, then tighten to NOT NULL once every row has a value.
ALTER TABLE "Client" ADD COLUMN "officeId" TEXT;
ALTER TABLE "Project" ADD COLUMN "officeId" TEXT;
ALTER TABLE "SocialPost" ADD COLUMN "officeId" TEXT;
ALTER TABLE "PublishingDestination" ADD COLUMN "officeId" TEXT;

-- Backfill: pre-existing rows are all this session's own fixture/test
-- data (see PORTAL-IMPLEMENTATION.md's Honesty Lock notes — no real
-- client data exists pre-launch), assigned to the Kuwait HQ office as a
-- reasonable default rather than left inconsistent.
UPDATE "Client" SET "officeId" = 'office-kuwait-hq' WHERE "officeId" IS NULL;
UPDATE "Project" SET "officeId" = 'office-kuwait-hq' WHERE "officeId" IS NULL;
UPDATE "SocialPost" SET "officeId" = 'office-kuwait-hq' WHERE "officeId" IS NULL;

ALTER TABLE "Client" ALTER COLUMN "officeId" SET NOT NULL;
ALTER TABLE "Project" ALTER COLUMN "officeId" SET NOT NULL;
ALTER TABLE "SocialPost" ALTER COLUMN "officeId" SET NOT NULL;
ALTER TABLE "PublishingDestination" ALTER COLUMN "officeId" SET NOT NULL;

-- AlterTable: IntegrationConfig — officeId stays nullable by design
-- (null = company-wide integration; see the schema.prisma comment).
DROP INDEX "IntegrationConfig_type_key";
ALTER TABLE "IntegrationConfig" ADD COLUMN     "lastPublishAt" TIMESTAMP(3),
ADD COLUMN     "lastPublishError" TEXT,
ADD COLUMN     "lastTokenRefreshAt" TIMESTAMP(3),
ADD COLUMN     "officeId" TEXT,
ADD COLUMN     "scopes" TEXT[];

-- AlterTable
ALTER TABLE "NewsPost" ADD COLUMN     "publishToOfficeIds" TEXT[];

-- DropIndex (old single-column uniques, superseded by composite ones below)
DROP INDEX "PublishingDestination_platform_key";
DROP INDEX "SocialPost_newsPostId_platform_key";

-- CreateTable
CREATE TABLE "EmailSettings" (
    "id" TEXT NOT NULL,
    "primaryContactEmail" TEXT NOT NULL,
    "secondaryContactEmail" TEXT,
    "careersEmail" TEXT,
    "hrEmail" TEXT,
    "supportEmail" TEXT,
    "salesEmail" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmailSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LegalPage" (
    "id" TEXT NOT NULL,
    "type" "LegalPageType" NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LegalPage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "LegalPage_type_key" ON "LegalPage"("type");

-- CreateIndex
CREATE UNIQUE INDEX "LegalPage_slug_key" ON "LegalPage"("slug");

-- CreateIndex
CREATE INDEX "Client_officeId_idx" ON "Client"("officeId");

-- CreateIndex
CREATE INDEX "IntegrationConfig_officeId_idx" ON "IntegrationConfig"("officeId");

-- CreateIndex
CREATE UNIQUE INDEX "IntegrationConfig_type_officeId_key" ON "IntegrationConfig"("type", "officeId");

-- CreateIndex
CREATE INDEX "Project_officeId_idx" ON "Project"("officeId");

-- CreateIndex
CREATE INDEX "PublishingDestination_officeId_idx" ON "PublishingDestination"("officeId");

-- CreateIndex
CREATE UNIQUE INDEX "PublishingDestination_platform_officeId_key" ON "PublishingDestination"("platform", "officeId");

-- CreateIndex
CREATE INDEX "SocialPost_officeId_idx" ON "SocialPost"("officeId");

-- CreateIndex
CREATE UNIQUE INDEX "SocialPost_newsPostId_platform_officeId_key" ON "SocialPost"("newsPostId", "platform", "officeId");

-- AddForeignKey
ALTER TABLE "Client" ADD CONSTRAINT "Client_officeId_fkey" FOREIGN KEY ("officeId") REFERENCES "Office"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_officeId_fkey" FOREIGN KEY ("officeId") REFERENCES "Office"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SocialPost" ADD CONSTRAINT "SocialPost_officeId_fkey" FOREIGN KEY ("officeId") REFERENCES "Office"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IntegrationConfig" ADD CONSTRAINT "IntegrationConfig_officeId_fkey" FOREIGN KEY ("officeId") REFERENCES "Office"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PublishingDestination" ADD CONSTRAINT "PublishingDestination_officeId_fkey" FOREIGN KEY ("officeId") REFERENCES "Office"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
