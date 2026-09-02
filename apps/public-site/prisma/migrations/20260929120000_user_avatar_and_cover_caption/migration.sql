-- Author byline: photo + job title live on the User account, set once,
-- shown automatically on every NewsPost that account authors.
ALTER TABLE "User" ADD COLUMN "jobTitle" TEXT;
ALTER TABLE "User" ADD COLUMN "avatarId" TEXT;
ALTER TABLE "User" ADD CONSTRAINT "User_avatarId_fkey" FOREIGN KEY ("avatarId") REFERENCES "MediaAsset"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Small italic caption rendered under the article's cover image.
ALTER TABLE "NewsPost" ADD COLUMN "coverImageCaption" TEXT;
