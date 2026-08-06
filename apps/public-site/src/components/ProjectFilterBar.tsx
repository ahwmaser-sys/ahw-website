import Link from 'next/link';
import { projects, isCommercialSector } from '@agp/ui-components';
import styles from './ProjectFilterBar.module.css';

// Derived from live project data, not hardcoded — same principle as the
// nav menu (FloatingNavigationPanel.tsx). Two-level: Residential is flat;
// Retail/Workplace/Hospitality are real commercial-sector work, grouped
// under a Commercial parent rather than listed as flat siblings competing
// with their own aggregate (see data/sectorTaxonomy.ts).
const sectorsInUse = Array.from(new Set(projects.map((p) => p.sector))).sort();
const TOP_LEVEL_SECTORS = ['All', ...sectorsInUse.filter((s) => !isCommercialSector(s))];
const COMMERCIAL_CHILDREN = sectorsInUse.filter(isCommercialSector);
const MARKETS = ['All', 'Egypt', 'Kuwait', 'UAE'];

export default function ProjectFilterBar({
  activeSector = 'all',
  activeMarket = 'all',
  resultCount = 0
}: {
  activeSector?: string;
  activeMarket?: string;
  resultCount?: number;
}) {
  const activeSectorLower = activeSector.toLowerCase();
  const showCommercialChildren = activeSectorLower === 'commercial'
    || COMMERCIAL_CHILDREN.some((s) => s.toLowerCase() === activeSectorLower);

  return (
    <section className={styles.filterBar}>
      <div className={styles.sectorFilters}>
        <div className={styles.filterGroup}>
          <span className={styles.filterLabel}>Sector</span>
          {TOP_LEVEL_SECTORS.map((sector) => {
            const sectorSlug = sector.toLowerCase();
            return (
              <Link
                key={sector}
                href={`/projects?sector=${sectorSlug}&market=${activeMarket.toLowerCase()}`}
                className={`${styles.filterButton} ${activeSectorLower === sectorSlug ? styles.active : ''}`}
              >
                {sector}
              </Link>
            );
          })}
          {COMMERCIAL_CHILDREN.length > 0 && (
            <Link
              href={`/projects?sector=commercial&market=${activeMarket.toLowerCase()}`}
              className={`${styles.filterButton} ${activeSectorLower === 'commercial' ? styles.active : ''}`}
            >
              Commercial
            </Link>
          )}
        </div>

        {/* Retail / Workplace / Hospitality — only shown once Commercial
            (or one of its children) is the active filter, so the flat
            state stays uncluttered while the hierarchy is still one
            click away. */}
        {showCommercialChildren && COMMERCIAL_CHILDREN.length > 0 && (
          <div className={`${styles.filterGroup} ${styles.filterGroupChild}`}>
            <span className={styles.filterLabel}>Within Commercial</span>
            {COMMERCIAL_CHILDREN.map((sector) => {
              const sectorSlug = sector.toLowerCase();
              return (
                <Link
                  key={sector}
                  href={`/projects?sector=${sectorSlug}&market=${activeMarket.toLowerCase()}`}
                  className={`${styles.filterButton} ${activeSectorLower === sectorSlug ? styles.active : ''}`}
                >
                  {sector}
                </Link>
              );
            })}
          </div>
        )}
      </div>

      <div className={styles.filterGroup}>
        <span className={styles.filterLabel}>Market</span>
        {MARKETS.map((market) => (
          <Link
            key={market}
            href={`/projects?sector=${activeSector.toLowerCase()}&market=${market.toLowerCase()}`}
            className={`${styles.filterButton} ${activeMarket.toLowerCase() === market.toLowerCase() ? styles.active : ''}`}
          >
            {market}
          </Link>
        ))}
      </div>

      <div className={styles.resultCount}>
        {resultCount > 0 ? `Showing ${resultCount} projects` : ''}
      </div>
    </section>
  );
}
