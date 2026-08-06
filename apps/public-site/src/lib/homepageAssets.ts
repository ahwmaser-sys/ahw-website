import fs from 'node:fs';
import path from 'node:path';
import { projects } from '@agp/ui-components';

/**
 * Loads homepage imagery from apps/public-site/public/homepage-assets/ at
 * build/request time — server-only (uses `fs`), never bundled to the client.
 *
 * This is the single source of truth for which images appear on the
 * homepage. Nothing here is hard-coded: adding, removing, or reordering
 * files in those folders is all it takes to change what visitors see —
 * no component or config file needs to be edited.
 *
 * See apps/public-site/public/homepage-assets/README.md for the curation
 * guide.
 */

const ASSETS_ROOT = path.join(process.cwd(), 'public', 'homepage-assets');
const IMAGE_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.avif']);

function isImageFile(filename: string): boolean {
  return IMAGE_EXTENSIONS.has(path.extname(filename).toLowerCase());
}

function listImageFiles(dirPath: string): string[] {
  if (!fs.existsSync(dirPath)) return [];
  return fs
    .readdirSync(dirPath, { withFileTypes: true })
    .filter((entry) => entry.isFile() && isImageFile(entry.name))
    .map((entry) => entry.name)
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
}

/**
 * Rotation images for a flat curated folder (e.g. "hero", "precision").
 * Every image in the folder is used, in filename order — prefix filenames
 * with 01-, 02-, etc. to control rotation order.
 */
export function getRotationImages(section: string): string[] {
  const dir = path.join(ASSETS_ROOT, section);
  return listImageFiles(dir).map((file) => `/homepage-assets/${section}/${file}`);
}

export interface SelectedWorkItem {
  slug: string;
  title: string;
  sector: string;
  city: string;
  market: string;
  status: string;
  image: string;
}

/**
 * Selected Work — one subfolder per project under
 * homepage-assets/selected-work/, named exactly after the project's slug
 * in projects.ts (an optional numeric "01-" prefix controls display order
 * and is stripped before matching). The first image in each subfolder is
 * shown; any additional images are kept as easy-to-swap candidates —
 * rename to promote one, or delete the ones you don't want.
 *
 * A subfolder whose name doesn't match any real project slug is skipped
 * silently rather than breaking the homepage.
 */
export function getSelectedWork(): SelectedWorkItem[] {
  const selectedWorkDir = path.join(ASSETS_ROOT, 'selected-work');
  if (!fs.existsSync(selectedWorkDir)) return [];

  const folderNames = fs
    .readdirSync(selectedWorkDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

  const items: SelectedWorkItem[] = [];
  for (const folderName of folderNames) {
    const slug = folderName.replace(/^\d+-/, '');
    const project = projects.find((p) => p.slug === slug);
    if (!project) continue;

    const images = listImageFiles(path.join(selectedWorkDir, folderName));
    const image =
      images.length > 0
        ? `/homepage-assets/selected-work/${folderName}/${images[0]}`
        : project.heroImage || project.hubFlagshipImage || project.ogImage;

    items.push({
      slug: project.slug,
      title: project.title,
      sector: project.sector,
      city: project.city,
      market: project.market,
      status: project.status || 'Completed',
      image,
    });
  }
  return items;
}
