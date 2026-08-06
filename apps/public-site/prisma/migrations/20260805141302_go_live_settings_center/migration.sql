-- CreateEnum
CREATE TYPE "IntegrationType" AS ENUM ('INSTAGRAM', 'FACEBOOK', 'LINKEDIN', 'GOOGLE_BUSINESS', 'GOOGLE_ANALYTICS', 'GOOGLE_SEARCH_CONSOLE', 'GOOGLE_MAPS', 'SMTP_EMAIL', 'AI_ANTHROPIC', 'AI_OPENAI', 'AI_GEMINI', 'AI_OPENROUTER');

-- CreateEnum
CREATE TYPE "IntegrationStatus" AS ENUM ('NOT_CONNECTED', 'PENDING', 'CONNECTED', 'ERROR');

-- AlterEnum
ALTER TYPE "LandingPageStatus" ADD VALUE 'ARCHIVED';

-- AlterEnum
ALTER TYPE "NewsPostStatus" ADD VALUE 'ARCHIVED';

-- AlterEnum
ALTER TYPE "ProjectStatus" ADD VALUE 'ARCHIVED';

-- AlterTable
ALTER TABLE "BrandKit" ADD COLUMN     "brandVoice" TEXT,
ADD COLUMN     "companyInfo" JSONB,
ADD COLUMN     "contactInfo" JSONB,
ADD COLUMN     "defaultCta" JSONB,
ADD COLUMN     "defaultHashtags" TEXT[],
ADD COLUMN     "emailSignature" TEXT,
ADD COLUMN     "footerSettings" JSONB,
ADD COLUMN     "socialLinks" JSONB;

-- AlterTable
ALTER TABLE "Client" ADD COLUMN     "archivedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "MediaAsset" ADD COLUMN     "archivedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "invitedById" TEXT;

-- DropTable
DROP TABLE "AIProviderConfig";

-- DropEnum
DROP TYPE "AIProviderKind";

-- CreateTable
CREATE TABLE "IntegrationConfig" (
    "id" TEXT NOT NULL,
    "type" "IntegrationType" NOT NULL,
    "status" "IntegrationStatus" NOT NULL DEFAULT 'NOT_CONNECTED',
    "credentialCiphertext" TEXT,
    "metadata" JSONB,
    "lastTestedAt" TIMESTAMP(3),
    "lastSuccessAt" TIMESTAMP(3),
    "lastError" TEXT,
    "connectedAt" TIMESTAMP(3),
    "connectedById" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IntegrationConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AISettings" (
    "id" TEXT NOT NULL,
    "defaultProvider" "IntegrationType",
    "defaultModel" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AISettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PortalSettings" (
    "id" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "maintenanceMode" BOOLEAN NOT NULL DEFAULT false,
    "allowInvitations" BOOLEAN NOT NULL DEFAULT true,
    "welcomeMessage" TEXT,
    "portalLogoAssetId" TEXT,
    "supportEmail" TEXT,
    "supportPhone" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PortalSettings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "IntegrationConfig_type_key" ON "IntegrationConfig"("type");

-- CreateIndex
CREATE INDEX "IntegrationConfig_status_idx" ON "IntegrationConfig"("status");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_invitedById_fkey" FOREIGN KEY ("invitedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IntegrationConfig" ADD CONSTRAINT "IntegrationConfig_connectedById_fkey" FOREIGN KEY ("connectedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

