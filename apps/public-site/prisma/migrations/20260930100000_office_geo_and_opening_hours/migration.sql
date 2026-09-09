-- LocalBusiness.geo and machine-readable opening hours for each office.
--
-- The contact page emitted `openingHours: office.workingHours`, whose value
-- is a sentence written for a human ("Sunday - Thursday: 9:00 AM - 5:00 PM").
-- schema.org expects its own syntax there ("Su-Th 09:00-17:00"), so Google
-- could not read the hours at all, and there were no coordinates -- both are
-- ordinary local-search signals for a firm with a walk-in office in two
-- countries. The hours themselves are unchanged and stay 9-5.
ALTER TABLE "Office" ADD COLUMN "latitude" DOUBLE PRECISION;
ALTER TABLE "Office" ADD COLUMN "longitude" DOUBLE PRECISION;
ALTER TABLE "Office" ADD COLUMN "openingHoursSchema" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- Seed the two existing offices with values supplied by the business owner
-- and cross-checked against each office's own Google Maps pin, which is the
-- listing these fields have to agree with.
--
-- Only ever fills a NULL/empty column, so re-running is safe and an edit made
-- later in the admin UI is never overwritten. Matching is by `slug`, the
-- stable machine key; a renamed office is simply skipped rather than guessed.
UPDATE "Office"
SET "latitude" = 29.961645036780837, "longitude" = 31.296448955179173
WHERE "slug" = 'egypt' AND "latitude" IS NULL;

UPDATE "Office"
SET "latitude" = 29.3670784, "longitude" = 47.9698431
WHERE "slug" = 'kuwait' AND "latitude" IS NULL;

-- Sunday through Thursday, 09:00-17:00, matching the hours the site already
-- shows. Days the office is closed are simply absent, which is how
-- schema.org expresses a closure -- there is no "closed" value to write.
UPDATE "Office"
SET "openingHoursSchema" = ARRAY['Su-Th 09:00-17:00']
WHERE "slug" IN ('egypt', 'kuwait')
  AND ("openingHoursSchema" IS NULL OR cardinality("openingHoursSchema") = 0);
