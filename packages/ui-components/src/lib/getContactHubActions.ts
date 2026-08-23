import type { Office } from '../data/offices';
import { buildWhatsAppLink } from './whatsapp';

declare global {
  interface Window {
    Tawk_API?: {
      maximize?: () => void;
    };
  }
}

export interface ContactHubTarget {
  label: string;
  href: string;
}

export interface ContactHubOfficeChoice {
  officeId: string;
  /** Always office.displayName — office.name is an internal/back-office
   *  label and must never reach the UI. */
  displayName: string;
  /** "AHW Architects Masr" and "AHW Architects" read as near-identical at
   *  a glance in a quick picker — the UI appends this so it's obvious
   *  which office (Egypt vs Kuwait) each choice actually is. */
  country: string;
  /** One destination for single-target channels (WhatsApp, booking); one
   *  per phone number for Call Us. UI renders a picker only when >1. */
  targets: ContactHubTarget[];
}

export interface ContactHubAction {
  id: string;
  label: string;
  tooltip: string;
  disabled?: boolean;
  /** Present for channels that require an office selection first. Absent
   *  for actions with no office step (Live Chat). */
  officeChoices?: ContactHubOfficeChoice[];
  /** Present only for actions with no office step and no href — a plain
   *  side-effecting trigger (Live Chat's Tawk_API.maximize()). */
  onSelect?: () => void;
}

function officeChoicesFor(
  offices: readonly Office[],
  getTargets: (office: Office) => ContactHubTarget[] | null
): ContactHubOfficeChoice[] {
  return offices.reduce<ContactHubOfficeChoice[]>((choices, office) => {
    const targets = getTargets(office);
    if (targets && targets.length > 0) {
      choices.push({ officeId: office.id, displayName: office.displayName, country: office.country, targets });
    }
    return choices;
  }, []);
}

/**
 * The single transformation layer between the Office business model
 * (offices[]) and any UI that needs to present contact channels. Nothing
 * outside this function should read offices[] directly. Every value here —
 * labels, links, phone numbers — traces back to a real Office field; if the
 * Office model changes, only this function needs to change.
 *
 * Automatically scales to however many offices exist: adding UAE, Saudi
 * Arabia, Qatar, or China to offices[] makes them appear under Start Your
 * Project / WhatsApp / Call Us with no change here or in any consumer.
 */
export function getContactHubActions(offices: readonly Office[]): ContactHubAction[] {
  return [
    {
      id: 'start-your-project',
      label: 'Start Your Project',
      tooltip: 'Schedule a Consultation',
      officeChoices: officeChoicesFor(offices, (office) =>
        office.contact.bookingUrl
          ? [{ label: office.displayName, href: office.contact.bookingUrl }]
          : null
      ),
    },
    {
      id: 'whatsapp',
      label: 'WhatsApp',
      tooltip: 'Message us on WhatsApp',
      officeChoices: officeChoicesFor(offices, (office) =>
        office.contact.whatsapp
          ? [
              {
                label: office.displayName,
                href: buildWhatsAppLink(
                  office.contact.whatsapp,
                  `Hi AHW Architects, I'd like to enquire about a project with the ${office.displayName}.`
                ),
              },
            ]
          : null
      ),
    },
    {
      id: 'call-us',
      label: 'Call Us',
      tooltip: 'Call our office directly',
      officeChoices: officeChoicesFor(offices, (office) =>
        office.contact.phones.length > 0
          ? office.contact.phones.map((phone) => ({
              label: phone,
              href: `tel:${phone.replace(/[^\d+]/g, '')}`,
            }))
          : null
      ),
    },
    {
      id: 'live-chat',
      label: 'Live Chat',
      tooltip: 'Talk to an Architect',
      onSelect: () => window.Tawk_API?.maximize?.(),
    },
  ];
}
