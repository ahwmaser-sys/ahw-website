import styles from './CategoryPills.module.css';

export interface CategoryPillsProps {
  items: string[];
}

// Display-only badges (not links) — real category-based filtering on
// the listing pages doesn't exist yet; this just surfaces the same
// taxonomy the admin already assigns, matching the visual weight a
// reader expects from an editorial article page.
export function CategoryPills({ items }: CategoryPillsProps) {
  if (items.length === 0) return null;
  return (
    <ul className={styles.pills}>
      {items.map((item) => (
        <li key={item} className={styles.pill}>
          {item}
        </li>
      ))}
    </ul>
  );
}
