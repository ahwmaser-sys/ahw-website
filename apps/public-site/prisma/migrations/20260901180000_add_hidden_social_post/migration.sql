-- CreateTable
CREATE TABLE "HiddenSocialPost" (
    "id" TEXT NOT NULL,
    "hiddenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "hiddenById" TEXT,

    CONSTRAINT "HiddenSocialPost_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "HiddenSocialPost" ADD CONSTRAINT "HiddenSocialPost_hiddenById_fkey" FOREIGN KEY ("hiddenById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
