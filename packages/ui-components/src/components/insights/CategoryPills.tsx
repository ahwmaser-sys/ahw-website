import Link from 'next/link';
import styles from './CategoryPills.module.css';

export interface CategoryPillsProps {
  items: string[];
  // When both given, each pill links to `${basePath}?${paramName}=<item>`
  // (e.g. the News listing's real `category` filter, or Publications'
  // existing `tag` filter) — omit either to fall back to a plain,
  // non-interactive badge.
  basePath?: string;
  paramName?: string;
}

export function CategoryPills({ items, basePath, paramName }: CategoryPillsProps) {
  if (items.length === 0) return null;
  const isLinked = Boolean(basePath && paramName);
  return (
    <ul className={styles.pills}>
      {items.map((item) =>
        isLinked ? (
          <li key={item}>
            <Link href={`${basePath}?${paramName}=${encodeURIComponent(item)}`} className={styles.pill}>
              {item}
            </Link>
          </li>
        ) : (
          <li key={item} className={styles.pill}>
            {item}
          </li>
        ),
      )}
    </ul>
  );
}
