/**
 * Turns schema.org's compact opening-hours syntax ("Su-Th 09:00-17:00") into
 * the OpeningHoursSpecification object Google's parsers actually consume.
 *
 * Both forms are valid schema.org, but they are not equally useful. The
 * compact string is a single opaque value; the expanded object names each day
 * and each time separately, which is what "open now" answers and the local
 * knowledge panel are built from. Since the site stores the compact form (it
 * is far easier to keep correct by hand), the expansion happens here.
 *
 * Anything unparseable returns null rather than a half-filled object -- wrong
 * opening hours send a visitor to a closed office, so silence is better.
 */

const DAY_NAMES = {
  Su: 'Sunday',
  Mo: 'Monday',
  Tu: 'Tuesday',
  We: 'Wednesday',
  Th: 'Thursday',
  Fr: 'Friday',
  Sa: 'Saturday',
} as const;

type DayCode = keyof typeof DAY_NAMES;
const ORDER = Object.keys(DAY_NAMES) as DayCode[];

const isDayCode = (value: string): value is DayCode => value in DAY_NAMES;

/** "Su-Th" -> every day in that range; "Sa" -> just that day. */
function expandDays(part: string): string[] | null {
  const days: string[] = [];
  for (const token of part.split(',')) {
    const [from, to] = token.split('-');
    if (!from || !isDayCode(from)) return null;
    if (to === undefined) {
      days.push(DAY_NAMES[from]);
      continue;
    }
    if (!isDayCode(to)) return null;
    // The week wraps, so a range may run past Saturday back to Sunday
    // ("Fr-Mo"). Walking forward with a modulo handles both directions
    // without special-casing them.
    let i = ORDER.indexOf(from);
    const end = ORDER.indexOf(to);
    for (let guard = 0; guard <= ORDER.length; guard += 1) {
      const day = ORDER[i];
      if (day) days.push(DAY_NAMES[day]);
      if (i === end) break;
      i = (i + 1) % ORDER.length;
    }
  }
  return days.length > 0 ? days : null;
}

export function parseOpeningHours(spec: string):
  | { dayOfWeek: string[]; opens: string; closes: string }
  | null {
  const match = /^([A-Za-z,-]+)\s+(\d{2}:\d{2})-(\d{2}:\d{2})$/.exec(spec.trim());
  if (!match) return null;
  const [, dayPart, opens, closes] = match;
  if (!dayPart || !opens || !closes) return null;
  const dayOfWeek = expandDays(dayPart);
  if (!dayOfWeek) return null;
  return { dayOfWeek, opens, closes };
}
