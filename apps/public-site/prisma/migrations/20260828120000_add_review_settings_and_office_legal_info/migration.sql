-- AlterTable
ALTER TABLE "BrandKit" ADD COLUMN "reviewSettings" JSONB;

-- AlterTable
ALTER TABLE "Office"
  ADD COLUMN "legalEntityName" TEXT,
  ADD COLUMN "commercialRegistrationNumber" TEXT,
  ADD COLUMN "taxRegistrationNumber" TEXT,
  ADD COLUMN "vatRegistrationNumber" TEXT,
  ADD COLUMN "vatRegistered" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "licenseNumber" TEXT,
  ADD COLUMN "otherRegistrationIdentifier" TEXT,
  ADD COLUMN "regulatoryNotes" TEXT,
  ADD COLUMN "displayLegalInfo" BOOLEAN NOT NULL DEFAULT false;
