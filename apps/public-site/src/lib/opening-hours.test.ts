import { describe, it, expect } from 'vitest';
import { parseOpeningHours } from './opening-hours';

describe('parseOpeningHours', () => {
  it('expands the range this site actually uses', () => {
    expect(parseOpeningHours('Su-Th 09:00-17:00')).toEqual({
      dayOfWeek: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday'],
      opens: '09:00',
      closes: '17:00',
    });
  });

  it('handles a single day and a comma list', () => {
    expect(parseOpeningHours('Sa 10:00-14:00')?.dayOfWeek).toEqual(['Saturday']);
    expect(parseOpeningHours('Mo,We 09:00-17:00')?.dayOfWeek).toEqual(['Monday', 'Wednesday']);
  });

  it('wraps a range across the end of the week', () => {
    // Fri -> Mon runs off the end of the list and back to Sunday; walking
    // forward with a modulo is the whole reason that case works.
    expect(parseOpeningHours('Fr-Mo 09:00-17:00')?.dayOfWeek).toEqual([
      'Friday', 'Saturday', 'Sunday', 'Monday',
    ]);
  });

  it('returns null rather than a partial object for bad input', () => {
    // Publishing wrong hours sends someone to a closed office, so anything
    // unrecognised has to be dropped, not guessed at.
    for (const bad of [
      'Sunday - Thursday: 9:00 AM - 5:00 PM', // the human sentence that used to be emitted
      'Su-Th 9:00-17:00',                     // unpadded hour
      'Su-Xx 09:00-17:00',                    // not a day
      'Su-Th 09:00',                          // no closing time
      '',
    ]) {
      expect(parseOpeningHours(bad)).toBeNull();
    }
  });
});
