-- CreateEnum
CREATE TYPE "CampaignStatus" AS ENUM ('DRAFT', 'ACTIVE', 'COMPLETED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "LandingPageStatus" AS ENUM ('DRAFT', 'PUBLISHED');

-- CreateEnum
CREATE TYPE "MediaAssetKind" AS ENUM ('IMAGE', 'VIDEO', 'DOCUMENT', 'ICON', 'LOGO');

-- CreateEnum
CREATE TYPE "AssetOrientation" AS ENUM ('LANDSCAPE', 'PORTRAIT', 'SQUARE');

-- CreateEnum
CREATE TYPE "ServiceLine" AS ENUM ('ARCHITECTURE', 'INTERIOR_DESIGN', 'DESIGN_BUILD', 'FIT_OUT');

-- CreateEnum
CREATE TYPE "AIProviderKind" AS ENUM ('NONE', 'ANTHROPIC', 'OPENAI', 'CUSTOM');

-- AlterEnum
ALTER TYPE "SocialPlatform" ADD VALUE 'GOOGLE_BUSINESS';

-- AlterTable
ALTER TABLE "Enquiry" ADD COLUMN     "landingPath" TEXT,
ADD COLUMN     "referrer" TEXT,
ADD COLUMN     "utmCampaign" TEXT,
ADD COLUMN     "utmMedium" TEXT,
ADD COLUMN     "utmSource" TEXT;

-- AlterTable
ALTER TABLE "NewsPost" ADD COLUMN     "aiAltText" TEXT,
ADD COLUMN     "aiCaption" TEXT,
ADD COLUMN     "aiMarketingSummary" TEXT,
ADD COLUMN     "aiMetaDescription" TEXT,
ADD COLUMN     "aiSeoTitle" TEXT,
ADD COLUMN     "aiSuggestedCta" TEXT,
ADD COLUMN     "aiSuggestedHashtags" TEXT[],
ADD COLUMN     "aiSuggestedKeywords" TEXT[],
ADD COLUMN     "campaignId" TEXT,
ADD COLUMN     "canonicalUrl" TEXT,
ADD COLUMN     "featuredImageId" TEXT,
ADD COLUMN     "metaDescription" TEXT,
ADD COLUMN     "metaTitle" TEXT,
ADD COLUMN     "ogDescription" TEXT,
ADD COLUMN     "ogImageId" TEXT,
ADD COLUMN     "ogTitle" TEXT,
ADD COLUMN     "structuredDataType" TEXT NOT NULL DEFAULT 'NewsArticle';

-- AlterTable
ALTER TABLE "SocialPost" ADD COLUMN     "campaignId" TEXT,
ADD COLUMN     "gbpCtaType" TEXT,
ADD COLUMN     "gbpCtaUrl" TEXT,
ADD COLUMN     "gbpTopicType" TEXT;

-- CreateTable
CREATE TABLE "NewsPostGalleryImage" (
    "id" TEXT NOT NULL,
    "newsPostId" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "NewsPostGalleryImage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Campaign" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "status" "CampaignStatus" NOT NULL DEFAULT 'DRAFT',
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "createdById" TEXT NOT NULL,

    CONSTRAINT "Campaign_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LandingPage" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "status" "LandingPageStatus" NOT NULL DEFAULT 'DRAFT',
    "publishedAt" TIMESTAMP(3),
    "campaignId" TEXT,
    "blocks" JSONB NOT NULL,
    "metaTitle" TEXT,
    "metaDescription" TEXT,
    "ogImageId" TEXT,
    "createdById" TEXT NOT NULL,

    CONSTRAINT "LandingPage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MediaAsset" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "kind" "MediaAssetKind" NOT NULL,
    "storageKey" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileType" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "width" INTEGER,
    "height" INTEGER,
    "durationSeconds" INTEGER,
    "orientation" "AssetOrientation",
    "dominantColors" TEXT[],
    "keywords" TEXT[],
    "aiTags" TEXT[],
    "photographer" TEXT,
    "copyright" TEXT,
    "altText" TEXT,
    "projectId" TEXT,
    "service" "ServiceLine",
    "uploadedById" TEXT NOT NULL,

    CONSTRAINT "MediaAsset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MediaAssetVariant" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "assetId" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "width" INTEGER NOT NULL,
    "height" INTEGER NOT NULL,
    "cropRegion" JSONB,

    CONSTRAINT "MediaAssetVariant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MediaAssetUsage" (
    "id" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MediaAssetUsage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MediaCollection" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "MediaCollection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MediaCollectionAsset" (
    "collectionId" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "MediaCollectionAsset_pkey" PRIMARY KEY ("collectionId","assetId")
);

-- CreateTable
CREATE TABLE "Category" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tag" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,

    CONSTRAINT "Tag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NewsPostCategory" (
    "newsPostId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,

    CONSTRAINT "NewsPostCategory_pkey" PRIMARY KEY ("newsPostId","categoryId")
);

-- CreateTable
CREATE TABLE "NewsPostTag" (
    "newsPostId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,

    CONSTRAINT "NewsPostTag_pkey" PRIMARY KEY ("newsPostId","tagId")
);

-- CreateTable
CREATE TABLE "MediaAssetCategory" (
    "mediaAssetId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,

    CONSTRAINT "MediaAssetCategory_pkey" PRIMARY KEY ("mediaAssetId","categoryId")
);

-- CreateTable
CREATE TABLE "MediaAssetTag" (
    "mediaAssetId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,

    CONSTRAINT "MediaAssetTag_pkey" PRIMARY KEY ("mediaAssetId","tagId")
);

-- CreateTable
CREATE TABLE "BrandKit" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL DEFAULT 'AHW Architects',
    "colors" JSONB NOT NULL,
    "typography" JSONB NOT NULL,
    "ctaStyles" JSONB NOT NULL,
    "logos" JSONB NOT NULL,
    "watermark" JSONB,
    "qrCodeStyle" JSONB,
    "websiteUrl" TEXT NOT NULL DEFAULT 'https://ahwspaces.com',
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "BrandKit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SocialTemplate" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT,
    "definition" JSONB NOT NULL,
    "previewImageKey" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isOfficial" BOOLEAN NOT NULL DEFAULT false,
    "createdById" TEXT,

    CONSTRAINT "SocialTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GeneratedGraphic" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "templateId" TEXT NOT NULL,
    "sourceAssetId" TEXT NOT NULL,
    "newsPostId" TEXT,
    "campaignId" TEXT,
    "variables" JSONB NOT NULL,
    "createdById" TEXT NOT NULL,

    CONSTRAINT "GeneratedGraphic_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GeneratedGraphicOutput" (
    "id" TEXT NOT NULL,
    "generatedGraphicId" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "width" INTEGER NOT NULL,
    "height" INTEGER NOT NULL,

    CONSTRAINT "GeneratedGraphicOutput_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AIProviderConfig" (
    "id" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "provider" "AIProviderKind" NOT NULL DEFAULT 'NONE',
    "model" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "AIProviderConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PublishingDestination" (
    "id" TEXT NOT NULL,
    "platform" "SocialPlatform" NOT NULL,
    "isEnabled" BOOLEAN NOT NULL DEFAULT false,
    "config" JSONB,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PublishingDestination_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PageView" (
    "id" TEXT NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "path" TEXT NOT NULL,
    "entityType" TEXT,
    "entityId" TEXT,
    "campaignId" TEXT,
    "referrer" TEXT,
    "utmSource" TEXT,
    "utmMedium" TEXT,
    "utmCampaign" TEXT,

    CONSTRAINT "PageView_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DomainEventOutbox" (
    "id" TEXT NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "eventType" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "deliveredAt" TIMESTAMP(3),

    CONSTRAINT "DomainEventOutbox_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "NewsPostGalleryImage_newsPostId_idx" ON "NewsPostGalleryImage"("newsPostId");

-- CreateIndex
CREATE UNIQUE INDEX "Campaign_slug_key" ON "Campaign"("slug");

-- CreateIndex
CREATE INDEX "Campaign_status_idx" ON "Campaign"("status");

-- CreateIndex
CREATE UNIQUE INDEX "LandingPage_slug_key" ON "LandingPage"("slug");

-- CreateIndex
CREATE INDEX "LandingPage_status_idx" ON "LandingPage"("status");

-- CreateIndex
CREATE INDEX "LandingPage_campaignId_idx" ON "LandingPage"("campaignId");

-- CreateIndex
CREATE INDEX "MediaAsset_kind_idx" ON "MediaAsset"("kind");

-- CreateIndex
CREATE INDEX "MediaAsset_orientation_idx" ON "MediaAsset"("orientation");

-- CreateIndex
CREATE INDEX "MediaAsset_projectId_idx" ON "MediaAsset"("projectId");

-- CreateIndex
CREATE INDEX "MediaAssetVariant_assetId_idx" ON "MediaAssetVariant"("assetId");

-- CreateIndex
CREATE UNIQUE INDEX "MediaAssetVariant_assetId_purpose_key" ON "MediaAssetVariant"("assetId", "purpose");

-- CreateIndex
CREATE INDEX "MediaAssetUsage_entityType_entityId_idx" ON "MediaAssetUsage"("entityType", "entityId");

-- CreateIndex
CREATE UNIQUE INDEX "MediaAssetUsage_assetId_entityType_entityId_key" ON "MediaAssetUsage"("assetId", "entityType", "entityId");

-- CreateIndex
CREATE UNIQUE INDEX "MediaCollection_slug_key" ON "MediaCollection"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Category_name_key" ON "Category"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Category_slug_key" ON "Category"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Tag_name_key" ON "Tag"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Tag_slug_key" ON "Tag"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "SocialTemplate_key_key" ON "SocialTemplate"("key");

-- CreateIndex
CREATE INDEX "SocialTemplate_category_idx" ON "SocialTemplate"("category");

-- CreateIndex
CREATE INDEX "GeneratedGraphic_newsPostId_idx" ON "GeneratedGraphic"("newsPostId");

-- CreateIndex
CREATE INDEX "GeneratedGraphic_campaignId_idx" ON "GeneratedGraphic"("campaignId");

-- CreateIndex
CREATE UNIQUE INDEX "GeneratedGraphicOutput_generatedGraphicId_purpose_key" ON "GeneratedGraphicOutput"("generatedGraphicId", "purpose");

-- CreateIndex
CREATE UNIQUE INDEX "PublishingDestination_platform_key" ON "PublishingDestination"("platform");

-- CreateIndex
CREATE INDEX "PageView_path_idx" ON "PageView"("path");

-- CreateIndex
CREATE INDEX "PageView_entityType_entityId_idx" ON "PageView"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "PageView_occurredAt_idx" ON "PageView"("occurredAt");

-- CreateIndex
CREATE INDEX "PageView_campaignId_idx" ON "PageView"("campaignId");

-- CreateIndex
CREATE INDEX "DomainEventOutbox_eventType_idx" ON "DomainEventOutbox"("eventType");

-- CreateIndex
CREATE INDEX "DomainEventOutbox_deliveredAt_idx" ON "DomainEventOutbox"("deliveredAt");

-- CreateIndex
CREATE INDEX "NewsPost_campaignId_idx" ON "NewsPost"("campaignId");

-- CreateIndex
CREATE INDEX "SocialPost_campaignId_idx" ON "SocialPost"("campaignId");

-- AddForeignKey
ALTER TABLE "NewsPost" ADD CONSTRAINT "NewsPost_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NewsPost" ADD CONSTRAINT "NewsPost_featuredImageId_fkey" FOREIGN KEY ("featuredImageId") REFERENCES "MediaAsset"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NewsPost" ADD CONSTRAINT "NewsPost_ogImageId_fkey" FOREIGN KEY ("ogImageId") REFERENCES "MediaAsset"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NewsPostGalleryImage" ADD CONSTRAINT "NewsPostGalleryImage_newsPostId_fkey" FOREIGN KEY ("newsPostId") REFERENCES "NewsPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NewsPostGalleryImage" ADD CONSTRAINT "NewsPostGalleryImage_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "MediaAsset"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SocialPost" ADD CONSTRAINT "SocialPost_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Campaign" ADD CONSTRAINT "Campaign_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LandingPage" ADD CONSTRAINT "LandingPage_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LandingPage" ADD CONSTRAINT "LandingPage_ogImageId_fkey" FOREIGN KEY ("ogImageId") REFERENCES "MediaAsset"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LandingPage" ADD CONSTRAINT "LandingPage_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MediaAsset" ADD CONSTRAINT "MediaAsset_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MediaAsset" ADD CONSTRAINT "MediaAsset_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MediaAssetVariant" ADD CONSTRAINT "MediaAssetVariant_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "MediaAsset"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MediaAssetUsage" ADD CONSTRAINT "MediaAssetUsage_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "MediaAsset"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MediaCollectionAsset" ADD CONSTRAINT "MediaCollectionAsset_collectionId_fkey" FOREIGN KEY ("collectionId") REFERENCES "MediaCollection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MediaCollectionAsset" ADD CONSTRAINT "MediaCollectionAsset_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "MediaAsset"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NewsPostCategory" ADD CONSTRAINT "NewsPostCategory_newsPostId_fkey" FOREIGN KEY ("newsPostId") REFERENCES "NewsPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NewsPostCategory" ADD CONSTRAINT "NewsPostCategory_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NewsPostTag" ADD CONSTRAINT "NewsPostTag_newsPostId_fkey" FOREIGN KEY ("newsPostId") REFERENCES "NewsPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NewsPostTag" ADD CONSTRAINT "NewsPostTag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "Tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MediaAssetCategory" ADD CONSTRAINT "MediaAssetCategory_mediaAssetId_fkey" FOREIGN KEY ("mediaAssetId") REFERENCES "MediaAsset"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MediaAssetCategory" ADD CONSTRAINT "MediaAssetCategory_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MediaAssetTag" ADD CONSTRAINT "MediaAssetTag_mediaAssetId_fkey" FOREIGN KEY ("mediaAssetId") REFERENCES "MediaAsset"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MediaAssetTag" ADD CONSTRAINT "MediaAssetTag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "Tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SocialTemplate" ADD CONSTRAINT "SocialTemplate_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GeneratedGraphic" ADD CONSTRAINT "GeneratedGraphic_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "SocialTemplate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GeneratedGraphic" ADD CONSTRAINT "GeneratedGraphic_sourceAssetId_fkey" FOREIGN KEY ("sourceAssetId") REFERENCES "MediaAsset"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GeneratedGraphic" ADD CONSTRAINT "GeneratedGraphic_newsPostId_fkey" FOREIGN KEY ("newsPostId") REFERENCES "NewsPost"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GeneratedGraphic" ADD CONSTRAINT "GeneratedGraphic_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GeneratedGraphic" ADD CONSTRAINT "GeneratedGraphic_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GeneratedGraphicOutput" ADD CONSTRAINT "GeneratedGraphicOutput_generatedGraphicId_fkey" FOREIGN KEY ("generatedGraphicId") REFERENCES "GeneratedGraphic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

