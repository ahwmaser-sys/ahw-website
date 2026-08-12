-- CreateEnum
CREATE TYPE "ReviewSource" AS ENUM ('GOOGLE', 'MANUAL');

-- CreateTable
CREATE TABLE "Review" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "source" "ReviewSource" NOT NULL DEFAULT 'GOOGLE',
    "externalId" TEXT,
    "reviewerName" TEXT NOT NULL,
    "reviewerPhotoUrl" TEXT,
    "rating" INTEGER NOT NULL,
    "reviewText" TEXT NOT NULL,
    "reviewDate" TIMESTAMP(3) NOT NULL,
    "sourceUrl" TEXT,
    "officeId" TEXT NOT NULL,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "isSampleData" BOOLEAN NOT NULL DEFAULT false,
    "lastSyncedAt" TIMESTAMP(3),

    CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Review_officeId_idx" ON "Review"("officeId");

-- CreateIndex
CREATE INDEX "Review_published_featured_idx" ON "Review"("published", "featured");

-- CreateIndex
CREATE UNIQUE INDEX "Review_source_externalId_key" ON "Review"("source", "externalId");

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_officeId_fkey" FOREIGN KEY ("officeId") REFERENCES "Office"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

