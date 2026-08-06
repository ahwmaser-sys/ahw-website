'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { ContactHubButton } from './ContactHubButton';
import { ContactHubMenu } from './ContactHubMenu';
import { getContactHubActions } from '../../lib/getContactHubActions';
import type { Office } from '../../data/offices';
import styles from './FloatingContactHub.module.css';

/**
 * The single floating communication entry point for the site — one glass
 * pill that expands into every contact channel. This component (and its
 * children) never reads offices itself — getContactHubActions() is the
 * only transformation layer between the Office business model and this
 * UI, and `offices` is supplied by the app (fetched from the real
 * database, see apps/public-site/src/lib/portal/offices.ts) rather than
 * imported. Adding a channel or an office means updating that adapter or
 * the database; this component only orchestrates open/closed state,
 * outside-click, Escape, and focus return.
 */
export function FloatingContactHub({ offices }: { offices: readonly Office[] }) {
  const [isOpen, setIsOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuId = useId();
  const actions = getContactHubActions(offices);

  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
        triggerRef.current?.focus();
      }
    }

    function handleClickOutside(event: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    // Button comes first in DOM (and .hub reverses the visual column) so
    // that once the menu opens, forward Tab from the button naturally
    // continues into the menu items instead of leaving the widget.
    <div className={styles.hub} ref={rootRef}>
      <ContactHubButton
        ref={triggerRef}
        isOpen={isOpen}
        onClick={() => setIsOpen((current) => !current)}
        menuId={menuId}
      />
      <ContactHubMenu
        actions={actions}
        isOpen={isOpen}
        menuId={menuId}
        onItemActivated={() => setIsOpen(false)}
      />
    </div>
  );
}
