-- CreateEnum
CREATE TYPE "PortfolioSector" AS ENUM ('RESIDENTIAL', 'COMMERCIAL', 'HOSPITALITY', 'WORKPLACE', 'RETAIL');

-- CreateEnum
CREATE TYPE "PortfolioMarket" AS ENUM ('EGYPT', 'KUWAIT', 'UAE', 'LEBANON');

-- CreateEnum
CREATE TYPE "PortfolioTier" AS ENUM ('FLAGSHIP', 'STANDARD');

-- CreateEnum
CREATE TYPE "PortfolioProjectStatus" AS ENUM ('DRAFT', 'PUBLISHED');

-- CreateEnum
CREATE TYPE "PortfolioImageSection" AS ENUM ('DESIGN', 'BUILD', 'RESULT');

-- CreateTable
CREATE TABLE "PortfolioProject" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "sector" "PortfolioSector" NOT NULL,
    "city" TEXT NOT NULL,
    "market" "PortfolioMarket" NOT NULL,
    "area" TEXT NOT NULL,
    "year" TEXT NOT NULL,
    "tier" "PortfolioTier" NOT NULL,
    "services" "ServiceLine"[],
    "client" TEXT,
    "status" "PortfolioProjectStatus" NOT NULL DEFAULT 'DRAFT',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "resultStatement" TEXT,
    "heroImageId" TEXT,
    "heroImageUrl" TEXT,
    "hubFlagshipImageId" TEXT,
    "hubFlagshipImageUrl" TEXT,
    "hubPairImageId" TEXT,
    "hubPairImageUrl" TEXT,
    "ogImageId" TEXT,
    "ogImageUrl" TEXT,
    "briefClientProblem" TEXT,
    "briefDefinitionalSentence" TEXT,
    "designKeyDecision" TEXT,
    "designCaption" TEXT,
    "buildDuration" TEXT,
    "buildChallengeResolution" TEXT,
    "buildFeatures" TEXT[],
    "buildCaption" TEXT,
    "resultOutcomes" TEXT[],
    "resultClientQuoteText" TEXT,
    "resultClientQuoteAuthor" TEXT,
    "resultCaption" TEXT,
    "relatedProjectSlugs" TEXT[],
    "relatedExpertiseTitle" TEXT,
    "relatedExpertiseHref" TEXT,
    "heroHeadline" TEXT,
    "heroSubtitle" TEXT,
    "story" TEXT[],
    "designPhilosophy" TEXT,
    "whyDifferent" TEXT,
    "clientExperience" TEXT[],
    "ctaHeadline" TEXT,
    "ctaSubtext" TEXT,
    "seoTitle" TEXT,
    "seoDescription" TEXT,
    "seoFocusKeyword" TEXT,
    "seoSecondaryKeywords" TEXT[],
    "seoOgTitle" TEXT,
    "seoOgDescription" TEXT,
    "seoTwitterTitle" TEXT,
    "seoTwitterDescription" TEXT,

    CONSTRAINT "PortfolioProject_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PortfolioProjectImage" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "section" "PortfolioImageSection" NOT NULL,
    "assetId" TEXT,
    "externalUrl" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "PortfolioProjectImage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PortfolioProjectFaqItem" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "PortfolioProjectFaqItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PortfolioProject_slug_key" ON "PortfolioProject"("slug");

-- CreateIndex
CREATE INDEX "PortfolioProject_status_idx" ON "PortfolioProject"("status");

-- CreateIndex
CREATE INDEX "PortfolioProject_sortOrder_idx" ON "PortfolioProject"("sortOrder");

-- CreateIndex
CREATE INDEX "PortfolioProjectImage_projectId_section_idx" ON "PortfolioProjectImage"("projectId", "section");

-- CreateIndex
CREATE INDEX "PortfolioProjectFaqItem_projectId_idx" ON "PortfolioProjectFaqItem"("projectId");

-- AddForeignKey
ALTER TABLE "PortfolioProject" ADD CONSTRAINT "PortfolioProject_heroImageId_fkey" FOREIGN KEY ("heroImageId") REFERENCES "MediaAsset"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PortfolioProject" ADD CONSTRAINT "PortfolioProject_hubFlagshipImageId_fkey" FOREIGN KEY ("hubFlagshipImageId") REFERENCES "MediaAsset"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PortfolioProject" ADD CONSTRAINT "PortfolioProject_hubPairImageId_fkey" FOREIGN KEY ("hubPairImageId") REFERENCES "MediaAsset"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PortfolioProject" ADD CONSTRAINT "PortfolioProject_ogImageId_fkey" FOREIGN KEY ("ogImageId") REFERENCES "MediaAsset"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PortfolioProjectImage" ADD CONSTRAINT "PortfolioProjectImage_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "PortfolioProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PortfolioProjectImage" ADD CONSTRAINT "PortfolioProjectImage_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "MediaAsset"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PortfolioProjectFaqItem" ADD CONSTRAINT "PortfolioProjectFaqItem_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "PortfolioProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;
