export interface NewsItem {
  id: string;
  title: string;
  excerpt: string;
  content?: string;
  date: string;
  slug: string;
  coverImage?: string;
  coverImageCaption?: string;
  thumbnailImage?: string;
  galleryImages?: { id: string; url: string; alt: string }[];
  relatedProjectSlugs?: string[];
  relatedPublicationId?: string;
  tags?: string[];
  categories?: { name: string; slug: string }[];
  author?: { name: string; jobTitle?: string; avatarUrl?: string };
  isFeatured?: boolean;
  readingTime?: string;
}

// Empty for now — add real entries here as announcements happen
// (new offices, awards, completed flagship projects, etc.)
// Do not fabricate placeholder announcements — every entry here is
// presented on the live site as a real company statement.
export const newsItems: NewsItem[] = [];
