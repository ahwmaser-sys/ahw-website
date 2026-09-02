-- "Publish to Social" for PortfolioProject
ALTER TABLE "PortfolioProject" ADD COLUMN "publishToOfficeIds" TEXT[];
ALTER TABLE "PortfolioProject" ADD COLUMN "publishPlatforms" "SocialPlatform"[];

-- SocialPost can now originate from either a NewsPost or a
-- PortfolioProject — newsPostId becomes optional, portfolioProjectId
-- added alongside it. Table already has rows (real NewsPost dispatch
-- history), so this must widen the existing column rather than
-- drop/recreate it.
ALTER TABLE "SocialPost" ALTER COLUMN "newsPostId" DROP NOT NULL;
ALTER TABLE "SocialPost" ADD COLUMN "portfolioProjectId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "SocialPost_portfolioProjectId_platform_officeId_key" ON "SocialPost"("portfolioProjectId", "platform", "officeId");

-- CreateIndex
CREATE INDEX "SocialPost_portfolioProjectId_idx" ON "SocialPost"("portfolioProjectId");

-- AddForeignKey
ALTER TABLE "SocialPost" ADD CONSTRAINT "SocialPost_portfolioProjectId_fkey" FOREIGN KEY ("portfolioProjectId") REFERENCES "PortfolioProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE "PortfolioSocialPostLink" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "linkedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "linkedById" TEXT,

    CONSTRAINT "PortfolioSocialPostLink_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PortfolioSocialPostLink_projectId_idx" ON "PortfolioSocialPostLink"("projectId");

-- AddForeignKey
ALTER TABLE "PortfolioSocialPostLink" ADD CONSTRAINT "PortfolioSocialPostLink_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "PortfolioProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PortfolioSocialPostLink" ADD CONSTRAINT "PortfolioSocialPostLink_linkedById_fkey" FOREIGN KEY ("linkedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
