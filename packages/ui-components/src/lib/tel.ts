export function buildTelLink(phone: string): string {
  return `tel:${phone.replace(/[^\d+]/g, '')}`;
}
