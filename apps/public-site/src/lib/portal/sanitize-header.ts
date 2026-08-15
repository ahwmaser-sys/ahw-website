// Strips ASCII control characters (including CR/LF) from user-supplied
// text before it's interpolated into an email Subject line — Contact's
// fullName/projectType and Careers' position/fullName all reach the
// Resend `subject` field with no other constraint on their content
// beyond zod's length checks. A crafted value containing \r\n could
// otherwise inject extra header-like lines if the mail provider didn't
// already reject that itself; this makes the app not rely on that.
// Only the C0 control range (0x00-0x1F) and DEL (0x7F) are stripped —
// every other Unicode character (accented names, Arabic, emoji, etc.)
// passes through untouched.
export function stripControlChars(value: string): string {
  // eslint-disable-next-line no-control-regex -- intentional: this IS the control-character strip.
  return value.replace(/[\x00-\x1F\x7F]/g, '').trim();
}
