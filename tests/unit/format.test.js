import { describe, test, expect } from 'vitest';
import {
  formatDate, formatRange, dayCount, formatDeadline, formatAsOf, plural,
  parseDateOnly, parseDateTime, dateInZone, toLocalInput, nowMs,
} from '../../js/format.js';

describe('formatDate', () => {
  test('formats as weekday, month, day, year', () => {
    expect(formatDate('2026-10-10')).toBe('Sat, Oct 10, 2026');
    expect(formatDate('2026-10-14')).toBe('Wed, Oct 14, 2026');
  });
  test('leap day and year ends', () => {
    expect(formatDate('2028-02-29')).toBe('Tue, Feb 29, 2028');
    expect(formatDate('2026-12-31')).toBe('Thu, Dec 31, 2026');
    expect(formatDate('2027-01-01')).toBe('Fri, Jan 1, 2027');
  });
  test('ignores a time portion and rejects bad input', () => {
    expect(formatDate('2026-10-10T23:59:00Z')).toBe('Sat, Oct 10, 2026');
    expect(formatDate('')).toBe('');
    expect(formatDate(null)).toBe('');
    expect(formatDate('2026-02-30')).toBe('');
    expect(formatDate('not a date')).toBe('');
  });
});

describe('dayCount', () => {
  test('inclusive count', () => {
    expect(dayCount('2026-10-10', '2026-10-14')).toBe(5);
    expect(dayCount('2026-10-10', '2026-10-10')).toBe(1);
  });
  test('across a month boundary', () => {
    expect(dayCount('2026-10-30', '2026-11-02')).toBe(4);
    expect(dayCount('2026-01-31', '2026-03-01')).toBe(30);
  });
  test('across a year boundary', () => {
    expect(dayCount('2026-12-30', '2027-01-02')).toBe(4);
  });
  test('leap year February', () => {
    expect(dayCount('2028-02-28', '2028-03-01')).toBe(3);
    expect(dayCount('2026-02-28', '2026-03-01')).toBe(2);
  });
  test('spans a daylight saving change without drifting', () => {
    expect(dayCount('2026-03-07', '2026-03-09')).toBe(3);
    expect(dayCount('2026-10-31', '2026-11-02')).toBe(3);
    expect(dayCount('2026-03-01', '2026-11-30')).toBe(275);
  });
  test('end before start gives zero or less, invalid gives NaN', () => {
    expect(dayCount('2026-10-14', '2026-10-10')).toBe(-3);
    expect(dayCount('2026-10-11', '2026-10-10')).toBe(0);
    expect(dayCount('', '2026-10-10')).toBeNaN();
    expect(dayCount('2026-10-10', 'x')).toBeNaN();
  });
});

describe('formatRange', () => {
  test('same year drops the first year', () => {
    expect(formatRange('2026-10-10', '2026-10-14')).toBe('Sat, Oct 10 to Wed, Oct 14, 2026, 5 days');
  });
  test('different years keep both', () => {
    expect(formatRange('2026-12-30', '2027-01-02')).toBe('Wed, Dec 30, 2026 to Sat, Jan 2, 2027, 4 days');
  });
  test('one day', () => {
    expect(formatRange('2026-10-10', '2026-10-10')).toBe('Sat, Oct 10, 2026, 1 day');
  });
  test('invalid input gives empty text', () => {
    expect(formatRange('', '2026-10-10')).toBe('');
  });
  test('month boundary', () => {
    expect(formatRange('2026-10-30', '2026-11-02')).toBe('Fri, Oct 30 to Mon, Nov 2, 2026, 4 days');
  });
});

describe('formatDeadline and formatAsOf', () => {
  test('viewer zone given explicitly', () => {
    expect(formatDeadline('2026-10-06T01:00:00Z', 'America/New_York')).toBe('Oct 5, 2026, 9:00 PM EDT');
    expect(formatAsOf('2026-10-03T18:14:00Z', 'America/New_York')).toBe('Oct 3, 2026, 2:14 PM EDT');
  });
  test('standard time after the fall change', () => {
    expect(formatDeadline('2026-11-02T02:00:00Z', 'America/New_York')).toBe('Nov 1, 2026, 9:00 PM EST');
  });
  test('daylight time on each side of the spring change', () => {
    expect(formatDeadline('2026-03-08T06:59:00Z', 'America/New_York')).toBe('Mar 8, 2026, 1:59 AM EST');
    expect(formatDeadline('2026-03-08T07:00:00Z', 'America/New_York')).toBe('Mar 8, 2026, 3:00 AM EDT');
  });
  test('other zones and UTC', () => {
    expect(formatDeadline('2026-10-06T01:00:00Z', 'UTC')).toBe('Oct 6, 2026, 1:00 AM UTC');
    expect(formatDeadline('2026-10-06T01:00:00Z', 'America/Los_Angeles')).toBe('Oct 5, 2026, 6:00 PM PDT');
  });
  test('midnight and noon', () => {
    expect(formatDeadline('2026-10-06T04:00:00Z', 'America/New_York')).toBe('Oct 6, 2026, 12:00 AM EDT');
    expect(formatDeadline('2026-10-06T16:00:00Z', 'America/New_York')).toBe('Oct 6, 2026, 12:00 PM EDT');
  });
  test('never contains a narrow no-break space', () => {
    expect(formatDeadline('2026-10-06T01:00:00Z', 'UTC')).not.toMatch(/[  ]/);
  });
  test('accepts a Date and handles bad input', () => {
    expect(formatDeadline(new Date('2026-10-06T01:00:00Z'), 'UTC')).toBe('Oct 6, 2026, 1:00 AM UTC');
    expect(formatDeadline('garbage', 'UTC')).toBe('');
    expect(formatDeadline(null, 'UTC')).toBe('');
    expect(formatDeadline('', 'UTC')).toBe('');
  });
  test('uses the viewer zone when none is given', () => {
    expect(formatDeadline('2026-10-06T01:00:00Z')).toMatch(/^Oct \d+, 2026, \d+:\d{2} [AP]M \S+$/);
  });
});

describe('plural', () => {
  test('one and many', () => {
    expect(plural(1, 'vote')).toBe('1 vote');
    expect(plural(0, 'vote')).toBe('0 votes');
    expect(plural(7, 'vote')).toBe('7 votes');
    expect(plural(1, 'activity', 'activities')).toBe('1 activity');
    expect(plural(6, 'activity', 'activities')).toBe('6 activities');
    expect(plural(1200, 'vote')).toBe('1,200 votes');
  });
});

describe('date helpers', () => {
  test('parseDateOnly validates real dates', () => {
    expect(parseDateOnly('2026-02-29')).toBeNull();
    expect(parseDateOnly('2028-02-29')).not.toBeNull();
    expect(parseDateOnly('2026-13-01')).toBeNull();
    expect(parseDateOnly('2026-00-10')).toBeNull();
    expect(parseDateOnly('2026-4-1')).toBeNull();
    expect(parseDateOnly(5)).toBeNull();
  });
  test('nowMs accepts Date, number, function, none', () => {
    expect(nowMs(new Date(5))).toBe(5);
    expect(nowMs(7)).toBe(7);
    expect(nowMs(() => 9)).toBe(9);
    expect(Math.abs(nowMs() - Date.now())).toBeLessThan(1000);
  });
  test('parseDateTime in a named zone', () => {
    const ms = parseDateTime('2026-10-05T21:00', 'America/New_York');
    expect(new Date(ms).toISOString()).toBe('2026-10-06T01:00:00.000Z');
    const est = parseDateTime('2026-11-02T21:00', 'America/New_York');
    expect(new Date(est).toISOString()).toBe('2026-11-03T02:00:00.000Z');
  });
  test('parseDateTime keeps an explicit offset', () => {
    expect(new Date(parseDateTime('2026-10-06T01:00:00Z', 'America/New_York')).toISOString()).toBe('2026-10-06T01:00:00.000Z');
    expect(new Date(parseDateTime('2026-10-05T21:00:00-04:00')).toISOString()).toBe('2026-10-06T01:00:00.000Z');
  });
  test('parseDateTime across the spring gap and fall repeat', () => {
    // 2:30 AM on Mar 8, 2026 does not exist in New York. Result lands just after the gap.
    const gap = parseDateTime('2026-03-08T02:30', 'America/New_York');
    expect(new Date(gap).toISOString()).toBe('2026-03-08T07:30:00.000Z');
    // 1:30 AM on Nov 1, 2026 happens twice. The first one is used.
    const rep = parseDateTime('2026-11-01T01:30', 'America/New_York');
    expect(new Date(rep).toISOString()).toBe('2026-11-01T05:30:00.000Z');
  });
  test('parseDateTime rejects nonsense', () => {
    for (const bad of ['', 'x', '2026-10-05', '2026-10-05T25:00', '2026-10-05T10:60', '2026-02-30T10:00', null, 4]) {
      expect(parseDateTime(bad, 'UTC')).toBeNull();
    }
  });
  test('parseDateTime with seconds and a space separator', () => {
    expect(new Date(parseDateTime('2026-10-05 21:00:30', 'UTC')).toISOString()).toBe('2026-10-05T21:00:30.000Z');
  });
  test('dateInZone crosses midnight', () => {
    const ms = Date.parse('2026-10-06T01:00:00Z');
    expect(dateInZone(ms, 'America/New_York')).toBe('2026-10-05');
    expect(dateInZone(ms, 'UTC')).toBe('2026-10-06');
    expect(dateInZone(ms, 'Asia/Tokyo')).toBe('2026-10-06');
  });
  test('toLocalInput round trips with parseDateTime', () => {
    const iso = '2026-10-06T01:00:00.000Z';
    expect(toLocalInput(iso, 'America/New_York')).toBe('2026-10-05T21:00');
    expect(new Date(parseDateTime(toLocalInput(iso, 'America/New_York'), 'America/New_York')).toISOString()).toBe(iso);
    expect(toLocalInput('2026-10-06T04:00:00Z', 'America/New_York')).toBe('2026-10-06T00:00');
    expect(toLocalInput('bad')).toBe('');
  });
});
