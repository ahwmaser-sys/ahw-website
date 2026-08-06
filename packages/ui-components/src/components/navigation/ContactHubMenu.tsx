'use client';

import { useEffect, useId, useState } from 'react';
import type { ContactHubAction, ContactHubOfficeChoice } from '../../lib/getContactHubActions';
import { CONTACT_HUB_ICONS, CONTACT_HUB_ACCENT_COLORS } from './contactHubIcons';
import styles from './ContactHubMenu.module.css';

interface ContactHubMenuProps {
  actions: ContactHubAction[];
  isOpen: boolean;
  menuId: string;
  onItemActivated: () => void;
}

/**
 * Renders whatever getContactHubActions() returns — no per-channel
 * branching. The same office-choice picker (and, for choices with more
 * than one target, the same nested target picker) is used for every
 * office-aware action; only the data differs. Live Chat has no
 * officeChoices, so it renders as a direct action with no picker at all.
 */
export function ContactHubMenu({ actions, isOpen, menuId, onItemActivated }: ContactHubMenuProps) {
  const [expandedActionId, setExpandedActionId] = useState<string | null>(null);
  const [expandedOfficeId, setExpandedOfficeId] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const tooltipBaseId = useId();

  // A stale picker shouldn't persist across separate visits to the hub.
  useEffect(() => {
    if (!isOpen) {
      setExpandedActionId(null);
      setExpandedOfficeId(null);
    }
  }, [isOpen]);

  function handleSelectAction(action: ContactHubAction) {
    if (action.disabled) return;
    if (action.officeChoices) {
      setExpandedActionId((current) => (current === action.id ? null : action.id));
      setExpandedOfficeId(null);
      return;
    }
    action.onSelect?.();
    onItemActivated();
  }

  function handleSelectOffice(choice: ContactHubOfficeChoice) {
    if (choice.targets.length > 1) {
      setExpandedOfficeId((current) => (current === choice.officeId ? null : choice.officeId));
      return;
    }
    // Single-target choices (WhatsApp, booking) navigate immediately —
    // the <a> handles that; this just closes the hub afterward.
    onItemActivated();
  }

  return (
    <div id={menuId} className={styles.menu} data-open={isOpen} aria-hidden={!isOpen}>
      {actions.map((action, index) => {
        const tooltipId = `${tooltipBaseId}-${action.id}`;
        const isExpanded = expandedActionId === action.id;
        const Icon = CONTACT_HUB_ICONS[action.id];

        return (
          // Trigger comes first in DOM (.itemGroup reverses the visual
          // column) so forward Tab from it continues into its own office
          // picker instead of jumping to the next action — same reasoning
          // as the button/menu order in FloatingContactHub.
          <div key={action.id} className={styles.itemGroup}>
            <div
              className={styles.item}
              style={{ transitionDelay: isOpen ? `${index * 40}ms` : '0ms' }}
            >
              <span
                id={tooltipId}
                role="tooltip"
                className={`${styles.tooltip} ${hoveredId === action.id ? styles.tooltipVisible : ''}`}
              >
                {action.tooltip}
              </span>
              <button
                type="button"
                className={styles.itemButton}
                disabled={action.disabled}
                onClick={() => handleSelectAction(action)}
                onMouseEnter={() => setHoveredId(action.id)}
                onMouseLeave={() => setHoveredId(null)}
                onFocus={() => setHoveredId(action.id)}
                onBlur={() => setHoveredId(null)}
                aria-label={action.label}
                aria-describedby={tooltipId}
                aria-haspopup={action.officeChoices ? 'true' : undefined}
                aria-expanded={action.officeChoices ? isExpanded : undefined}
                tabIndex={isOpen ? 0 : -1}
              >
                <span
                  className={styles.itemIconCircle}
                  style={
                    CONTACT_HUB_ACCENT_COLORS[action.id]
                      ? { backgroundColor: CONTACT_HUB_ACCENT_COLORS[action.id], color: '#fff' }
                      : undefined
                  }
                >
                  {Icon && <Icon className={styles.itemIcon} />}
                </span>
                <span className={styles.itemLabel}>{action.label}</span>
              </button>
            </div>

            {action.officeChoices && isExpanded && (
              <div className={styles.subMenu}>
                {action.officeChoices.map((choice) => {
                  const officeExpanded = expandedOfficeId === choice.officeId;
                  const singleTarget = choice.targets.length === 1 ? choice.targets[0] : null;

                  return (
                    // Trigger comes first in DOM (.officeGroup reverses the
                    // visual column) so forward Tab from it continues into
                    // its own target picker instead of jumping to the next
                    // office — same reasoning as the button/menu order in
                    // FloatingContactHub.
                    <div key={choice.officeId} className={styles.officeGroup}>
                      {singleTarget ? (
                        <a
                          href={singleTarget.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={styles.subItem}
                          onClick={() => handleSelectOffice(choice)}
                          tabIndex={isOpen ? 0 : -1}
                        >
                          {choice.displayName}
                        </a>
                      ) : (
                        <button
                          type="button"
                          className={styles.subItem}
                          onClick={() => handleSelectOffice(choice)}
                          aria-haspopup="true"
                          aria-expanded={officeExpanded}
                          tabIndex={isOpen ? 0 : -1}
                        >
                          {choice.displayName}
                        </button>
                      )}
                      {choice.targets.length > 1 && officeExpanded && (
                        <div className={styles.targetMenu}>
                          {choice.targets.map((target) => (
                            <a
                              key={target.href}
                              href={target.href}
                              target={target.href.startsWith('tel:') ? undefined : '_blank'}
                              rel={target.href.startsWith('tel:') ? undefined : 'noopener noreferrer'}
                              className={styles.subItem}
                              onClick={onItemActivated}
                              tabIndex={isOpen ? 0 : -1}
                            >
                              {target.label}
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
