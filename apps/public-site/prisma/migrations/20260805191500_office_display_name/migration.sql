ALTER TABLE "Office" ADD COLUMN "displayName" TEXT;

UPDATE "Office" SET "displayName" = 'GCC Office' WHERE "id" = 'office-kuwait-hq';
UPDATE "Office" SET "displayName" = 'Egypt Office' WHERE "id" = 'office-egypt';
UPDATE "Office" SET "displayName" = "name" WHERE "displayName" IS NULL;

ALTER TABLE "Office" ALTER COLUMN "displayName" SET NOT NULL;
