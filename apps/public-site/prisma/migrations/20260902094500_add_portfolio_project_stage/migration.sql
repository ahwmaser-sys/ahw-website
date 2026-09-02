-- Real-world construction/delivery stage ("Completed", "Design Phase",
-- "Ongoing", ...) — a real, live-used field (lib/homepageAssets.ts's
-- getSelectedWork() reads it for the homepage "Selected Work" grid)
-- that was missed in the initial schema, caught before the data
-- migration script was written by reading the actual static data.
ALTER TABLE "PortfolioProject" ADD COLUMN "stage" TEXT;
