-- Fix: PortfolioProject.services was typed as ServiceLine[] (the
-- 4-value enum used elsewhere for MediaAsset's core-discipline
-- filter), but a survey of the real static project data found 11+
-- distinct free-form values (Landscape, Furnishing, Renovation,
-- Construction Supervision, ...) that don't fit that taxonomy.
-- Table has zero rows at this point (created in the previous
-- migration, no data migrated yet), so a plain drop/re-add is safe.
ALTER TABLE "PortfolioProject" DROP COLUMN "services";
ALTER TABLE "PortfolioProject" ADD COLUMN "services" TEXT[];
