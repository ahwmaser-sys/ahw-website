ALTER TABLE "Office" ADD COLUMN "postalCode" TEXT;

UPDATE "Office" SET "postalCode" = '11728' WHERE "id" = 'office-egypt';
