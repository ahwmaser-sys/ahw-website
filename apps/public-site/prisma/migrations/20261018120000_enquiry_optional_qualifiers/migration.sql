-- Country, project type and timeline are no longer mandatory on the contact
-- form, so the columns have to be able to say "not given".
--
-- The form asked for seven mandatory answers before a stranger could send a
-- first message; it now asks for four. Storing '' in a NOT NULL column would
-- have avoided this migration and left the table unable to distinguish "they
-- did not say" from "they said nothing", which is exactly what NULL is for --
-- and the admin list would have rendered a blank where it should say that.
--
-- Widening only: dropping NOT NULL cannot fail on existing rows, and every
-- enquiry already recorded keeps its value.
ALTER TABLE "Enquiry" ALTER COLUMN "country" DROP NOT NULL;
ALTER TABLE "Enquiry" ALTER COLUMN "projectType" DROP NOT NULL;
ALTER TABLE "Enquiry" ALTER COLUMN "timeline" DROP NOT NULL;
