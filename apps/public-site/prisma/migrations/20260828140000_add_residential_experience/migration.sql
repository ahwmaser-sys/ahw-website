-- CreateEnum
CREATE TYPE "ExperienceCategory" AS ENUM ('CURRENT_AHW_PROJECT', 'PREVIOUS_AHW_EXPERIENCE', 'TEAM_PROFESSIONAL_EXPERIENCE', 'COLLABORATIVE_INVOLVEMENT', 'TARGET_COMMUNITY');

-- CreateEnum
CREATE TYPE "ExperienceStatus" AS ENUM ('VERIFIED', 'REVIEW_REQUIRED', 'TARGET');

-- CreateTable
CREATE TABLE "ResidentialExperience" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,
    "developerName" TEXT,
    "developerVerified" BOOLEAN NOT NULL DEFAULT false,
    "country" TEXT NOT NULL DEFAULT 'Egypt',
    "city" TEXT,
    "region" TEXT,
    "projectType" TEXT,
    "experienceCategory" "ExperienceCategory" NOT NULL,
    "scope" TEXT,
    "experiencePeriod" TEXT,
    "publicWording" TEXT NOT NULL,
    "linkedProjectSlug" TEXT,
    "internalNotes" TEXT,
    "confidence" TEXT,
    "status" "ExperienceStatus" NOT NULL DEFAULT 'REVIEW_REQUIRED',
    "publicDisplay" BOOLEAN NOT NULL DEFAULT false,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "archivedAt" TIMESTAMP(3),

    CONSTRAINT "ResidentialExperience_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ResidentialExperience_status_publicDisplay_idx" ON "ResidentialExperience"("status", "publicDisplay");

-- Seed: migrate the 10 approved static entries verbatim, plus the two
-- confirmed developer updates and the new D-Bay (Tatweer Misr) record —
-- kept REVIEW_REQUIRED/not publicly displayed since no experience
-- category or public wording was supplied for it yet, so it can never
-- leak onto the live site until an admin completes and verifies it.
INSERT INTO "ResidentialExperience" ("id", "updatedAt", "name", "developerName", "developerVerified", "region", "projectType", "experienceCategory", "scope", "publicWording", "status", "publicDisplay", "displayOrder") VALUES
  ('rexp_lake_view', CURRENT_TIMESTAMP, 'Lake View', NULL, false, 'New Cairo', NULL, 'TEAM_PROFESSIONAL_EXPERIENCE', NULL, 'Professional experience', 'VERIFIED', true, 10),
  ('rexp_katameya_heights', CURRENT_TIMESTAMP, 'Katameya Heights', 'Starlight Developments (also known as Katameya Group)', true, 'New Cairo', NULL, 'TEAM_PROFESSIONAL_EXPERIENCE', NULL, 'Professional experience', 'VERIFIED', true, 20),
  ('rexp_katameya_dunes', CURRENT_TIMESTAMP, 'Katameya Dunes', NULL, false, 'New Cairo', NULL, 'COLLABORATIVE_INVOLVEMENT', NULL, 'Professional involvement', 'VERIFIED', true, 30),
  ('rexp_hyde_park', CURRENT_TIMESTAMP, 'Hyde Park', 'DMAC', true, 'New Cairo', NULL, 'TEAM_PROFESSIONAL_EXPERIENCE', NULL, 'Professional experience', 'VERIFIED', true, 40),
  ('rexp_mountain_view', CURRENT_TIMESTAMP, 'Mountain View', NULL, false, 'New Cairo', NULL, 'TEAM_PROFESSIONAL_EXPERIENCE', NULL, 'Professional experience', 'VERIFIED', true, 50),
  ('rexp_dyar_park', CURRENT_TIMESTAMP, 'Dyar Park', NULL, false, 'New Cairo', NULL, 'TEAM_PROFESSIONAL_EXPERIENCE', NULL, 'Professional experience', 'VERIFIED', true, 60),
  ('rexp_down_east', CURRENT_TIMESTAMP, 'Down East', NULL, false, 'New Cairo', NULL, 'COLLABORATIVE_INVOLVEMENT', 'Client support and supervision', 'Professional involvement, including client support and supervision', 'VERIFIED', true, 70),
  ('rexp_badya', CURRENT_TIMESTAMP, 'Badya', 'Palm Hills Developments', true, 'West Cairo / 6th of October', NULL, 'TEAM_PROFESSIONAL_EXPERIENCE', NULL, 'Professional experience', 'VERIFIED', true, 80),
  ('rexp_b_bay', CURRENT_TIMESTAMP, 'B-Bay', NULL, false, 'North Coast', 'Chalet', 'TEAM_PROFESSIONAL_EXPERIENCE', NULL, 'Professional experience — chalet', 'VERIFIED', true, 90),
  ('rexp_al_montazah_village', CURRENT_TIMESTAMP, 'Al Montazah Village', NULL, false, 'North Coast', NULL, 'TEAM_PROFESSIONAL_EXPERIENCE', NULL, 'Professional experience', 'VERIFIED', true, 100),
  ('rexp_d_bay', CURRENT_TIMESTAMP, 'D-Bay', 'Tatweer Misr', true, 'North Coast', NULL, 'TEAM_PROFESSIONAL_EXPERIENCE', NULL, 'Pending review — not yet displayed publicly', 'REVIEW_REQUIRED', false, 110);
