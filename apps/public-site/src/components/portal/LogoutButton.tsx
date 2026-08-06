'use client';

import { useRouter } from 'next/navigation';
import styles from './PortalShell.module.css';

export function LogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    await fetch('/api/portal/auth/logout', { method: 'POST' });
    router.push('/');
    router.refresh();
  }

  return (
    <button type="button" onClick={handleLogout} className={styles.logoutButton}>
      Sign Out
    </button>
  );
}
