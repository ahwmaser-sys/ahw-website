-- BrandKit.contactInfo and BrandKit.socialLinks are removed: that data
-- now lives on real Office rows (see the multi_office_architecture
-- migration, which seeded Egypt + Kuwait with the exact same real
-- values these columns held). Brand Kit becomes Global Company only —
-- legal identity and brand assets, never per-office contact/social data.
ALTER TABLE "BrandKit" DROP COLUMN "contactInfo",
DROP COLUMN "socialLinks";

-- One-time correction: the legal company name is "AHW Architects Masr"
-- (this audit's explicit instruction), not the earlier "AHW Architects"
-- placeholder default. Only touches the legalName key inside the
-- companyInfo JSON, leaving tagline/founded untouched.
UPDATE "BrandKit"
SET "companyInfo" = jsonb_set("companyInfo"::jsonb, '{legalName}', '"AHW Architects Masr"')
WHERE "companyInfo" IS NOT NULL;
