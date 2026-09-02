import { prisma } from '../db';
import { getIntegrationCredential } from '../integrations/store';
import { getFreshGoogleBusinessAccessToken } from '../integrations/google-business-token';
import { fetchGoogleBusinessApi } from '../integrations/google-business-http';
import { getActiveOffices } from '../offices';
import type { SocialAdapter } from './types';

// Real posts pulled directly from each platform for the public Social
// page — the reverse direction from dispatch.ts (which pushes the
// site's own content out). Every platform call is wrapped so one
// office's expired token or one platform's outage never blanks the
// whole feed — a partial feed (or an empty one) is the honest result of
// a real failure, never a fabricated placeholder post.

interface LiveSocialPostSource {
  id: string;
  platform: SocialAdapter['platform'];
  officeId: string;
  officeName: string;
  caption: string | null;
  imageUrl: string | null;
  permalink: string | null;
  postedAt: string | null;
}

export interface LiveSocialPost extends LiveSocialPostSource {
  // Admin-controlled (see HiddenSocialPost) — always computed, so the
  // admin moderation page can show hidden posts (to unhide them) while
  // the public page can filter them out, from the same one function.
  hidden: boolean;
  // Admin-controlled (see PinnedSocialPost) — a pinned post always
  // survives the 60-day window and MIN_POSTS trimming below, and the
  // public page gives it the featured slot ahead of whatever's merely
  // newest.
  pinned: boolean;
  // Admin-controlled (see PortfolioSocialPostLink) — set when an admin
  // has linked this real, live-pulled post to a PortfolioProject, so
  // both /social and the project's own page can cross-link.
  relatedProjectSlug?: string;
}

const GRAPH_API = 'https://graph.facebook.com/v21.0';
// Same versioned-API constant used by integrations/test.ts and
// social/linkedin.ts — bump all three together when it's next updated.
const LINKEDIN_API_VERSION = '202608';
const POSTS_PER_OFFICE = 6;
// Every outbound call here is cached at the Next.js fetch layer so a
// stream of site visitors never turns into a stream of Graph/LinkedIn
// API calls — refreshed at most once every 30 minutes.
const REVALIDATE_SECONDS = 1800;
// Keeps the public page current rather than a scroll of years-old
// posts — anything older is still on the platform itself, just not
// duplicated here.
const MAX_AGE_DAYS = 60;
// A quiet couple of months would otherwise leave the page looking
// empty or half-full — see the fallback in getLiveSocialFeed below.
const MIN_POSTS = 9;
// AHW cross-posts the same caption to more than one platform (confirmed
// live — several posts had byte-identical captions on Facebook and
// Instagram the same day), which otherwise shows as two cards for one
// real post. Fixed priority order for which platform's card wins when
// captions match — arbitrary but stable, so which card survives doesn't
// change from one render to the next.
const DEDUP_PRIORITY: SocialAdapter['platform'][] = ['INSTAGRAM', 'FACEBOOK', 'LINKEDIN', 'GOOGLE_BUSINESS'];

function normalizeCaption(caption: string | null): string {
  return (caption ?? '').trim().toLowerCase().replace(/\s+/g, ' ');
}

interface FacebookCredential {
  pageAccessToken: string;
  pageId: string;
}
interface InstagramCredential {
  accessToken: string;
  businessAccountId: string;
}
interface LinkedInCredential {
  accessToken: string;
  organizationId: string;
}

async function fetchFacebookPosts(officeId: string, officeName: string): Promise<LiveSocialPostSource[]> {
  const cred = await getIntegrationCredential<FacebookCredential>('FACEBOOK', officeId);
  if (!cred) return [];
  try {
    const res = await fetch(
      `${GRAPH_API}/${cred.pageId}/posts?fields=message,full_picture,permalink_url,created_time&limit=${POSTS_PER_OFFICE}&access_token=${cred.pageAccessToken}`,
      { next: { revalidate: REVALIDATE_SECONDS } },
    );
    if (!res.ok) return [];
    const body = (await res.json()) as {
      data?: { id: string; message?: string; full_picture?: string; permalink_url?: string; created_time?: string }[];
    };
    return (body.data ?? []).map((post) => ({
      id: `FACEBOOK:${post.id}`,
      platform: 'FACEBOOK' as const,
      officeId,
      officeName,
      caption: post.message ?? null,
      imageUrl: post.full_picture ?? null,
      permalink: post.permalink_url ?? null,
      postedAt: post.created_time ?? null,
    }));
  } catch {
    return [];
  }
}

async function fetchInstagramPosts(officeId: string, officeName: string): Promise<LiveSocialPostSource[]> {
  const cred = await getIntegrationCredential<InstagramCredential>('INSTAGRAM', officeId);
  if (!cred) return [];
  try {
    const res = await fetch(
      `${GRAPH_API}/${cred.businessAccountId}/media?fields=caption,media_url,thumbnail_url,permalink,timestamp,media_type&limit=${POSTS_PER_OFFICE}&access_token=${cred.accessToken}`,
      { next: { revalidate: REVALIDATE_SECONDS } },
    );
    if (!res.ok) return [];
    const body = (await res.json()) as {
      data?: { id: string; caption?: string; media_url?: string; thumbnail_url?: string; permalink?: string; timestamp?: string; media_type?: string }[];
    };
    return (body.data ?? []).map((post) => ({
      id: `INSTAGRAM:${post.id}`,
      platform: 'INSTAGRAM' as const,
      officeId,
      officeName,
      caption: post.caption ?? null,
      // A VIDEO node's own media_url is the video file itself, not an
      // image — thumbnail_url is the still image Instagram generates
      // for it, which is what this feed can actually render.
      imageUrl: (post.media_type === 'VIDEO' ? post.thumbnail_url : post.media_url) ?? post.thumbnail_url ?? null,
      permalink: post.permalink ?? null,
      postedAt: post.timestamp ?? null,
    }));
  } catch {
    return [];
  }
}

// The Posts API response only carries an image *reference*
// (content.media.id, an urn:li:image:... urn) — the actual downloadUrl
// requires a separate Images API call. Same access token/scope covers
// both (w_organization_social, already granted at connect time — see
// oauth.ts), this just wasn't wired up. Batch-fetched once per office
// per call rather than per-post, and only for image urns — a
// urn:li:video:... media id (video posts) is left imageless rather than
// pulling in the separate Videos API for a thumbnail.
async function resolveLinkedInImageUrls(imageUrns: string[], accessToken: string): Promise<Map<string, string>> {
  const urls = new Map<string, string>();
  if (imageUrns.length === 0) return urls;
  try {
    const ids = imageUrns.map((urn) => encodeURIComponent(urn)).join(',');
    const res = await fetch(`https://api.linkedin.com/rest/images?ids=List(${ids})`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'X-Restli-Protocol-Version': '2.0.0',
        'Linkedin-Version': LINKEDIN_API_VERSION,
      },
      next: { revalidate: REVALIDATE_SECONDS },
    });
    if (!res.ok) return urls;
    const body = (await res.json()) as {
      results?: Record<string, { downloadUrl?: string; status?: string }>;
    };
    for (const [urn, image] of Object.entries(body.results ?? {})) {
      if (image.downloadUrl) urls.set(urn, image.downloadUrl);
    }
  } catch {
    // Leave those posts imageless rather than fail the whole office.
  }
  return urls;
}

async function fetchLinkedInPosts(officeId: string, officeName: string): Promise<LiveSocialPostSource[]> {
  const cred = await getIntegrationCredential<LinkedInCredential>('LINKEDIN', officeId);
  if (!cred) return [];
  try {
    const author = encodeURIComponent(`urn:li:organization:${cred.organizationId}`);
    const res = await fetch(`https://api.linkedin.com/rest/posts?q=author&author=${author}&count=${POSTS_PER_OFFICE}&sortBy=CREATED`, {
      headers: {
        Authorization: `Bearer ${cred.accessToken}`,
        'X-Restli-Protocol-Version': '2.0.0',
        'Linkedin-Version': LINKEDIN_API_VERSION,
        'X-RestLi-Method': 'FINDER',
      },
      next: { revalidate: REVALIDATE_SECONDS },
    });
    if (!res.ok) return [];
    const body = (await res.json()) as {
      elements?: { id: string; commentary?: string; createdAt?: number; content?: { media?: { id?: string } } }[];
    };
    const elements = body.elements ?? [];
    const imageUrns = elements
      .map((post) => post.content?.media?.id)
      .filter((id): id is string => Boolean(id?.startsWith('urn:li:image:')));
    const imageUrls = await resolveLinkedInImageUrls(imageUrns, cred.accessToken);
    // No public permalink field on the Posts API response — linking to
    // the organization's own feed is the honest option rather than
    // guessing a per-post URL shape.
    const orgPermalink = `https://www.linkedin.com/company/${cred.organizationId}/posts/`;
    return elements.map((post) => {
      const mediaId = post.content?.media?.id;
      return {
        id: `LINKEDIN:${post.id}`,
        platform: 'LINKEDIN' as const,
        officeId,
        officeName,
        caption: post.commentary ?? null,
        imageUrl: (mediaId && imageUrls.get(mediaId)) ?? null,
        permalink: orgPermalink,
        postedAt: post.createdAt ? new Date(post.createdAt).toISOString() : null,
      };
    });
  } catch {
    return [];
  }
}

async function fetchGoogleBusinessPosts(officeId: string, officeName: string): Promise<LiveSocialPostSource[]> {
  const token = await getFreshGoogleBusinessAccessToken(officeId);
  if (!token.ok) return [];
  try {
    const res = await fetchGoogleBusinessApi(`https://mybusiness.googleapis.com/v4/${token.locationId}/localPosts?pageSize=${POSTS_PER_OFFICE}`, {
      headers: { Authorization: `Bearer ${token.accessToken}` },
      next: { revalidate: REVALIDATE_SECONDS },
    });
    if (!res.ok) return [];
    const body = (await res.json()) as {
      localPosts?: { name: string; summary?: string; media?: { googleUrl?: string }[]; searchUrl?: string; createTime?: string }[];
    };
    return (body.localPosts ?? []).map((post) => ({
      id: `GOOGLE_BUSINESS:${post.name}`,
      platform: 'GOOGLE_BUSINESS' as const,
      officeId,
      officeName,
      caption: post.summary ?? null,
      imageUrl: post.media?.[0]?.googleUrl ?? null,
      permalink: post.searchUrl ?? null,
      postedAt: post.createTime ?? null,
    }));
  } catch {
    return [];
  }
}

// One office at a time (not Promise.all across offices) — same
// deliberate-sequencing reasoning as google-business-token's own
// discovery calls: this is a page-render path, not a burst import, and
// four platforms already run in parallel per office.
export async function getLiveSocialFeed(): Promise<LiveSocialPost[]> {
  const [offices, hiddenRows, pinnedRows, linkRows] = await Promise.all([
    getActiveOffices(),
    prisma.hiddenSocialPost.findMany({ select: { id: true } }),
    prisma.pinnedSocialPost.findMany({ select: { id: true } }),
    prisma.portfolioSocialPostLink.findMany({ select: { id: true, project: { select: { slug: true } } } }),
  ]);
  const hiddenIds = new Set(hiddenRows.map((row) => row.id));
  const pinnedIds = new Set(pinnedRows.map((row) => row.id));
  const linkedSlugs = new Map(linkRows.map((row) => [row.id, row.project.slug]));
  const perOffice = await Promise.all(
    offices.map(async (office) => {
      const [facebook, instagram, linkedin, google] = await Promise.all([
        fetchFacebookPosts(office.id, office.displayName),
        fetchInstagramPosts(office.id, office.displayName),
        fetchLinkedInPosts(office.id, office.displayName),
        fetchGoogleBusinessPosts(office.id, office.displayName),
      ]);
      return [...facebook, ...instagram, ...linkedin, ...google];
    }),
  );
  const candidates = perOffice
    .flat()
    .filter((post) => post.caption || post.imageUrl)
    .sort((a, b) => (b.postedAt ?? '').localeCompare(a.postedAt ?? ''));

  // Cross-posted duplicates: same office, same caption text (once
  // normalized), posted the same calendar day. Only dedupes when there's
  // real caption text to compare — an image-only post always keeps its
  // own card rather than risk collapsing two genuinely different posts
  // that both happen to have no caption. Runs before the age window
  // below so the fallback (next comment) still starts from a
  // duplicate-free list.
  const seen = new Map<string, LiveSocialPostSource>();
  for (const post of candidates) {
    const normalizedCaption = normalizeCaption(post.caption);
    const dedupeKey = normalizedCaption ? `${post.officeId}:${(post.postedAt ?? '').slice(0, 10)}:${normalizedCaption}` : `id:${post.id}`;
    const existing = seen.get(dedupeKey);
    if (!existing || DEDUP_PRIORITY.indexOf(post.platform) < DEDUP_PRIORITY.indexOf(existing.platform)) {
      seen.set(dedupeKey, post);
    }
  }
  const deduped = [...seen.values()].sort((a, b) => (b.postedAt ?? '').localeCompare(a.postedAt ?? ''));

  const cutoff = Date.now() - MAX_AGE_DAYS * 24 * 60 * 60 * 1000;
  const unpinnedDeduped = deduped.filter((post) => !pinnedIds.has(post.id));
  const withinWindow = unpinnedDeduped.filter((post) => !post.postedAt || new Date(post.postedAt).getTime() >= cutoff);
  // A quiet month shouldn't leave the page looking empty — reach further
  // back only when the last MAX_AGE_DAYS genuinely didn't have enough
  // real posts, never the other way around (a busy couple of months
  // never gets padded with older ones).
  const selectedUnpinned = withinWindow.length >= MIN_POSTS ? withinWindow : unpinnedDeduped.slice(0, MIN_POSTS);

  // Pinned posts always survive, regardless of age or the MIN_POSTS
  // trimming above — that's the entire point of pinning one.
  const pinned = deduped.filter((post) => pinnedIds.has(post.id));
  const selected = [...pinned, ...selectedUnpinned].sort((a, b) => (b.postedAt ?? '').localeCompare(a.postedAt ?? ''));

  return selected.map((post) => {
    const relatedProjectSlug = linkedSlugs.get(post.id);
    return {
      ...post,
      hidden: hiddenIds.has(post.id),
      pinned: pinnedIds.has(post.id),
      ...(relatedProjectSlug ? { relatedProjectSlug } : {}),
    };
  });
}

