-- Sender identity per email type on EmailSettings (From Name / From
-- Email / Reply-To), separate from the existing recipient fields.
ALTER TABLE "EmailSettings"
  ADD COLUMN "contactFromName" TEXT,
  ADD COLUMN "contactFromEmail" TEXT,
  ADD COLUMN "contactReplyTo" TEXT,
  ADD COLUMN "careersFromName" TEXT,
  ADD COLUMN "careersFromEmail" TEXT,
  ADD COLUMN "careersReplyTo" TEXT,
  ADD COLUMN "supportFromName" TEXT,
  ADD COLUMN "supportFromEmail" TEXT,
  ADD COLUMN "supportReplyTo" TEXT,
  ADD COLUMN "salesFromName" TEXT,
  ADD COLUMN "salesFromEmail" TEXT,
  ADD COLUMN "salesReplyTo" TEXT,
  ADD COLUMN "marketingFromName" TEXT,
  ADD COLUMN "marketingFromEmail" TEXT,
  ADD COLUMN "marketingReplyTo" TEXT;
