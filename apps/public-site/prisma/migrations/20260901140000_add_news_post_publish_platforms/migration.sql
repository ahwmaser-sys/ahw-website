-- AlterTable
ALTER TABLE "NewsPost" ADD COLUMN "publishPlatforms" "SocialPlatform"[] NOT NULL DEFAULT ARRAY[]::"SocialPlatform"[];
