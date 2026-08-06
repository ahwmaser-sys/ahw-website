import { cache } from 'react';
import type { LegalPageType } from '@prisma/client';
import { prisma } from './db';
import { getEmailSettings } from './email-settings';
import { getSiteUrl } from '../site-config';
import { getActiveBrandKit } from './brand-kit';

// Fixed routes (/privacy-policy, /terms-of-service, /cookie-policy,
// /data-deletion) map one-to-one to these four types — the taxonomy
// itself is fixed (these are the four legal documents every deployment
// needs), but every word of content is Admin-editable, seeded once with
// real content on first read, the same lazy-seed pattern as BrandKit/
// EmailSettings/PortalSettings.
export const LEGAL_PAGE_ROUTES: Record<LegalPageType, string> = {
  PRIVACY_POLICY: '/privacy-policy',
  TERMS_OF_SERVICE: '/terms-of-service',
  COOKIE_POLICY: '/cookie-policy',
  DATA_DELETION: '/data-deletion',
};

async function defaultBodyFor(type: LegalPageType): Promise<string> {
  const [siteUrl, emailSettings, kit] = await Promise.all([getSiteUrl(), getEmailSettings(), getActiveBrandKit()]);
  const legalName = (kit.companyInfo as { legalName?: string } | null)?.legalName ?? 'AHW Architects';
  const email = emailSettings.primaryContactEmail;
  const displayUrl = siteUrl.replace(/^https?:\/\//, '');

  switch (type) {
    case 'PRIVACY_POLICY':
      return `This policy explains what personal information ${legalName} collects through ${displayUrl}, why we collect it, and the choices you have.

1. Who We Are
${legalName} ("we", "us", "our") is a multidisciplinary architecture, interior design, and design-build fit-out practice operating multiple offices. This policy applies to personal information collected through ${displayUrl} (the "Site").

2. Information We Collect
We collect information in the following ways:
- Information you submit directly. When you use our contact or enquiry form, we collect your full name, company (optional), email address, phone number, country, project type, budget range (optional), timeline, selected office, and the message you write to us.
- Technical information. Like most websites, our hosting infrastructure automatically logs standard technical data such as IP address, browser type, device type, and pages visited, for security and performance purposes.
- Local storage. We store a single, non-tracking preference (your light/dark appearance setting) in your browser's local storage. This is not used for analytics or advertising.

3. How We Use Your Information
We use the information we collect to respond to your project enquiry and route it to the correct office, send you a confirmation that we received your message, maintain internal records of enquiries for follow-up and business development, keep the Site secure and functioning correctly, and comply with legal obligations where applicable. We do not sell your personal information, and we do not use it for third-party advertising.

4. Who We Share Information With
We share personal information only with service providers who help us operate the Site and respond to enquiries, including email delivery providers, hosting and infrastructure providers, and Google Maps (to display our office locations, governed by Google's own privacy policy when you interact with an embedded map). We may also disclose information if required by law, or to protect the rights, safety, or property of ${legalName} or others.

5. Data Retention
We retain enquiry information for as long as reasonably necessary to respond to your request and maintain business records, typically no longer than needed for these purposes unless a longer period is required by law or by an ongoing client relationship.

6. Your Rights
Depending on your location, you may have the right to access, correct, or request deletion of your personal information, and to object to certain processing. See our Data Deletion page for how to request deletion, or contact us using the details below.

7. Cookies
The Site does not currently use tracking or advertising cookies. See our Cookie Policy page for details on the local, non-tracking storage in use.

8. Third-Party Links
Our Site links to third-party platforms, including Instagram, LinkedIn, and Facebook. We are not responsible for the privacy practices of these third-party sites — please review their respective privacy policies before interacting with them.

9. Data Security
We take reasonable technical and organizational measures to protect your personal information against unauthorized access, alteration, or loss. However, no method of transmission over the internet is completely secure, and we cannot guarantee absolute security.

10. Multiple Offices
Because ${legalName} operates multiple offices, an enquiry you submit may be viewed by team members in more than one office as part of routing it to the most relevant team.

11. Changes to This Policy
We may update this policy from time to time to reflect changes to our practices or for legal reasons. The "Last updated" date at the top of this page indicates when this policy was last revised.

12. Contact Us
For any questions about this policy or your personal information, contact us at ${email}, or reach out via our contact page.`;

    case 'TERMS_OF_SERVICE':
      return `These terms govern your use of ${displayUrl}. By browsing this Site or submitting an enquiry through it, you agree to these terms.

1. About This Site
${displayUrl} is operated by ${legalName}, a multidisciplinary architecture, interior design, and design-build fit-out practice operating multiple offices ("we", "us").

2. Use of the Site
You agree to use this Site only for lawful purposes. You must not attempt to gain unauthorized access to the Site, its systems, or any connected network; use automated means (bots, scrapers) to extract content without our written permission; submit false, misleading, or spam content through our forms; or use the Site in any way that could damage, disable, or impair it.

3. Intellectual Property
All content on this Site — including project photography, renderings, text, logos, and our name and monogram — is the property of ${legalName} or its licensors and is protected by copyright and trademark law. You may not reproduce, distribute, or create derivative works from this content without our prior written consent, except for personal, non-commercial viewing.

4. Project Enquiries
Submitting an enquiry through our contact form is an expression of interest only. It does not create a binding contract, client relationship, or obligation on ${legalName} to accept a project. Any actual engagement for architectural, design, or construction services will be governed by a separate, signed service agreement.

5. Accuracy of Content
We take care to ensure project information, imagery, and descriptions on this Site are accurate and up to date. However, completed projects may be renovated, altered, or occupied differently over time, and we make no warranty that any project will look identical to how it is depicted.

6. Third-Party Links
This Site contains links to third-party platforms (including Instagram, LinkedIn, Facebook, and Google Maps). We do not control and are not responsible for the content, accuracy, or practices of these third-party sites.

7. Limitation of Liability
To the fullest extent permitted by law, ${legalName} shall not be liable for any indirect, incidental, or consequential damages arising from your use of, or inability to use, this Site. The Site and its content are provided "as is" without warranties of any kind, express or implied.

8. Governing Law
These terms are governed by the laws of the jurisdiction in which the relevant office operates, without regard to conflict-of-law principles. Any dispute arising from a specific project engagement is governed by the terms of the applicable signed service agreement, not this Site's terms.

9. Changes to These Terms
We may revise these terms from time to time. Continued use of the Site after changes are posted constitutes acceptance of the updated terms. The "Last updated" date above reflects the most recent revision.

10. Contact Us
Questions about these terms can be sent to ${email}, or via our contact page.`;

    case 'COOKIE_POLICY':
      return `This policy explains how ${legalName} uses cookies and similar local browser storage on ${displayUrl}.

1. What We Use
This Site does not use tracking or advertising cookies. The only browser storage in use is a single, non-tracking local preference (your light/dark appearance setting), stored in your browser's local storage rather than a cookie sent to our servers.

2. Third-Party Embeds
Pages that embed a Google Map or a live chat widget may cause the relevant third party (Google, or our live-chat provider) to set their own cookies, governed by their own cookie and privacy policies, not this one.

3. Analytics
If Google Analytics is connected (Settings → Integrations), it may set its own first-party cookies to measure aggregate site usage. This is used for understanding overall traffic, not for identifying individual visitors or advertising.

4. Managing Cookies
Most browsers let you block or delete cookies through their settings. Blocking cookies from third-party embeds (like Google Maps) may prevent those specific features from working correctly.

5. Changes to This Policy
We may update this policy if the cookies or local storage this Site uses change. The "Last updated" date above reflects the most recent revision.

6. Contact Us
Questions about this policy can be sent to ${email}, or via our contact page.`;

    case 'DATA_DELETION':
      return `${legalName} respects your right to request deletion of the personal information you have shared with us through ${displayUrl}.

1. What You Can Request
You may request deletion of any personal information you submitted through our contact or careers forms, including your name, contact details, and the content of your message or application.

2. How To Request Deletion
Send a deletion request to ${email} with the email address or phone number you used when submitting your enquiry or application, so we can locate your record. We will confirm once your request has been processed.

3. Response Time
We aim to complete verified deletion requests within a reasonable timeframe, typically within 30 days of confirming your identity and the record to be deleted.

4. Exceptions
We may retain limited information where required by law, to resolve disputes, to enforce our agreements, or where a record forms part of an active client engagement governed by a separate signed service agreement.

5. Changes to This Policy
We may update this policy from time to time. The "Last updated" date above reflects the most recent revision.

6. Contact Us
To request deletion of your data, or ask questions about this policy, contact us at ${email}, or via our contact page.`;
  }
}

const DEFAULT_TITLES: Record<LegalPageType, string> = {
  PRIVACY_POLICY: 'Privacy Policy',
  TERMS_OF_SERVICE: 'Terms of Service',
  COOKIE_POLICY: 'Cookie Policy',
  DATA_DELETION: 'Data Deletion',
};

const DEFAULT_SLUGS: Record<LegalPageType, string> = {
  PRIVACY_POLICY: 'privacy-policy',
  TERMS_OF_SERVICE: 'terms-of-service',
  COOKIE_POLICY: 'cookie-policy',
  DATA_DELETION: 'data-deletion',
};

async function seedLegalPage(type: LegalPageType) {
  return prisma.legalPage.create({
    data: { type, title: DEFAULT_TITLES[type], slug: DEFAULT_SLUGS[type], body: await defaultBodyFor(type) },
  });
}

export const getLegalPage = cache(async (type: LegalPageType) => {
  const existing = await prisma.legalPage.findUnique({ where: { type } });
  if (existing) return existing;
  return seedLegalPage(type);
});

export async function getAllLegalPages() {
  const types: LegalPageType[] = ['PRIVACY_POLICY', 'TERMS_OF_SERVICE', 'COOKIE_POLICY', 'DATA_DELETION'];
  const existing = await prisma.legalPage.findMany();
  const byType = new Map(existing.map((p) => [p.type, p]));
  const missing = types.filter((t) => !byType.has(t));
  for (const type of missing) {
    byType.set(type, await seedLegalPage(type));
  }
  return types.map((t) => byType.get(t)!);
}
