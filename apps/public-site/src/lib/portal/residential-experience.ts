import { cache } from 'react';
import { residentialExperience as staticFallback } from '@agp/ui-components';
import { prisma } from './db';
import { getPublishedPortfolioSlugs } from '../portfolio';
import type { ResidentialExperience } from '@prisma/client';

export async function listResidentialExperience() {
  return prisma.residentialExperience.findMany({
    where: { archivedAt: null },
    orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
  });
}

export async function getResidentialExperienceById(id: string) {
  return prisma.residentialExperience.findUnique({ where: { id } });
}

export interface PublicResidentialExperienceEntry {
  id: string;
  name: string;
  region: string;
  projectType?: string;
  developer?: string;
  publicWording: string;
  linkedProjectSlug?: string;
}

function toPublicShape(row: ResidentialExperience, validProjectSlugs: Set<string>): PublicResidentialExperienceEntry {
  return {
    id: row.id,
    name: row.name,
    region: row.region ?? 'Other',
    ...(row.projectType ? { projectType: row.projectType } : {}),
    // developerName is shown only when independently verified — never a
    // raw, unverified claim about a third party (see schema.prisma's
    // ResidentialExperience comment and the go-live brief's explicit
    // "must not imply partnership" rule).
    ...(row.developerName && row.developerVerified ? { developer: row.developerName } : {}),
    publicWording: row.publicWording,
    ...(row.linkedProjectSlug && validProjectSlugs.has(row.linkedProjectSlug) ? { linkedProjectSlug: row.linkedProjectSlug } : {}),
  };
}

// Server-rendered, read-only, cached per request (same reasoning as
// getActiveBrandKit/getActiveOffices — collapses repeated calls within
// one render into a single query). Never returns internalNotes,
// confidence, status, or developerVerified — see PublicResidentialExperienceEntry,
// which structurally cannot carry them.
export const getPublicResidentialExperience = cache(async (): Promise<PublicResidentialExperienceEntry[]> => {
  try {
    const rows = await prisma.residentialExperience.findMany({
      where: {
        archivedAt: null,
        status: 'VERIFIED',
        publicDisplay: true,
        // Belt-and-suspenders alongside the status check — a
        // TARGET_COMMUNITY row must never appear publicly even if it was
        // ever mistakenly marked VERIFIED/publicDisplay by mistake.
        experienceCategory: { not: 'TARGET_COMMUNITY' },
      },
      orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
    });
    const validProjectSlugs = await getPublishedPortfolioSlugs();
    return rows.map((row) => toPublicShape(row, validProjectSlugs));
  } catch (error) {
    // Never render a blank section on a transient DB failure — fall back
    // to the last-known-good static snapshot instead of hiding real,
    // approved public content. Logged, not exposed: the caught error
    // never reaches the response.
    console.error('[residential-experience] DB query failed, using static fallback dataset:', error);
    return staticFallback.map((entry) => ({
      id: entry.id,
      name: entry.name,
      region: entry.region,
      ...(entry.projectType ? { projectType: entry.projectType } : {}),
      ...(entry.developer ? { developer: entry.developer } : {}),
      publicWording: entry.publicWording,
    }));
  }
});
