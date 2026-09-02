import { describe, it, expect, vi } from 'vitest';

const { prismaMock } = vi.hoisted(() => ({
  prismaMock: {
    residentialExperience: { findMany: vi.fn() },
    // getPublicResidentialExperience validates linkedProjectSlug against
    // real published portfolio projects (lib/portfolio.ts's
    // getPublishedPortfolioSlugs) — stubbed here so that check has
    // something real to match against instead of throwing (which would
    // silently divert every test into the static-fallback branch).
    portfolioProject: { findMany: vi.fn().mockResolvedValue([{ slug: 'khiran-chalet-kuwait' }]) },
  },
}));
vi.mock('./db', () => ({ prisma: prismaMock }));

import { getPublicResidentialExperience } from './residential-experience';

function row(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id: 'r1',
    name: 'Test Community',
    region: 'New Cairo',
    projectType: null,
    developerName: null,
    developerVerified: false,
    publicWording: 'Professional experience',
    linkedProjectSlug: null,
    internalNotes: 'never shown publicly',
    confidence: 'Client-stated',
    status: 'VERIFIED',
    publicDisplay: true,
    ...overrides,
  };
}

describe('getPublicResidentialExperience', () => {
  it('hides the developer name when developerVerified is false', async () => {
    prismaMock.residentialExperience.findMany.mockResolvedValueOnce([row({ developerName: 'Acme Developments', developerVerified: false })]);
    const [entry] = await getPublicResidentialExperience();
    expect(entry?.developer).toBeUndefined();
  });

  it('shows the developer name only when developerVerified is true', async () => {
    prismaMock.residentialExperience.findMany.mockResolvedValueOnce([row({ developerName: 'Palm Hills Developments', developerVerified: true })]);
    const [entry] = await getPublicResidentialExperience();
    expect(entry?.developer).toBe('Palm Hills Developments');
  });

  it('omits linkedProjectSlug when it does not match a real project', async () => {
    prismaMock.residentialExperience.findMany.mockResolvedValueOnce([row({ linkedProjectSlug: 'not-a-real-project-slug' })]);
    const [entry] = await getPublicResidentialExperience();
    expect(entry?.linkedProjectSlug).toBeUndefined();
  });

  it('includes linkedProjectSlug when it matches a real project', async () => {
    prismaMock.residentialExperience.findMany.mockResolvedValueOnce([row({ linkedProjectSlug: 'khiran-chalet-kuwait' })]);
    const [entry] = await getPublicResidentialExperience();
    expect(entry?.linkedProjectSlug).toBe('khiran-chalet-kuwait');
  });

  it('never exposes internal-only fields on the returned public shape', async () => {
    prismaMock.residentialExperience.findMany.mockResolvedValueOnce([row()]);
    const [entry] = await getPublicResidentialExperience();
    expect(entry).not.toHaveProperty('internalNotes');
    expect(entry).not.toHaveProperty('status');
    expect(entry).not.toHaveProperty('confidence');
    expect(entry).not.toHaveProperty('developerVerified');
    expect(entry).not.toHaveProperty('publicDisplay');
  });

  it('falls back to the static dataset instead of rendering nothing when the query fails', async () => {
    prismaMock.residentialExperience.findMany.mockRejectedValueOnce(new Error('connection lost'));
    const result = await getPublicResidentialExperience();
    expect(result.length).toBeGreaterThan(0);
  });
});
