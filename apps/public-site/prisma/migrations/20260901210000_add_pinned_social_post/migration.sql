-- CreateTable
CREATE TABLE "PinnedSocialPost" (
    "id" TEXT NOT NULL,
    "pinnedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "pinnedById" TEXT,

    CONSTRAINT "PinnedSocialPost_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "PinnedSocialPost" ADD CONSTRAINT "PinnedSocialPost_pinnedById_fkey" FOREIGN KEY ("pinnedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
