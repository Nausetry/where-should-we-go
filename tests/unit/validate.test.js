import { describe, test, expect } from 'vitest';
import { normalizeText, validateField as vf, validateTripForm, parseInviteList } from '../../js/validate.js';

const NOW = Date.parse('2026-09-30T16:00:00Z'); // 12:00 PM EDT
const TZ = 'America/New_York';
const rep = (c, n) => c.repeat(n);

describe('normalizeText', () => {
  test('trims and collapses spaces', () => {
    expect(normalizeText('  Cape   Cod,  October ').value).toBe('Cape Cod, October');
    expect(normalizeText('a  b').value).toBe('a b');
    expect(normalizeText('a b').value).toBe('a b');
  });
  test('flags control characters and keeps the text', () => {
    for (const c of ['\n', '\t', '\r', '\u0000', '\u001F', '\u007F', '\u0085']) {
      const r = normalizeText(`ab${c}cd`);
      expect(r.hadControl).toBe(true);
    }
    expect(normalizeText('ab\ncd').value).toBe('ab\ncd');
    expect(normalizeText('plain').hadControl).toBe(false);
  });
  test('null and undefined become empty', () => {
    expect(normalizeText(null)).toEqual({ value: '', hadControl: false });
    expect(normalizeText(undefined).value).toBe('');
  });
  test('accented and emoji characters are not control characters', () => {
    expect(normalizeText('Café São Paulo').hadControl).toBe(false);
  });
});

// Text fields: [field, min, max, shortMessage, longMessage, example]
const textCases = [
  ['tripName', 3, 60, 'Trip name needs at least 3 characters.', 'Keep the trip name to 60 characters.', 'Cape Cod, October'],
  ['destination', 2, 60, 'Enter a destination, for example Provincetown, MA.', 'Keep the destination to 60 characters.', 'Provincetown, MA'],
  ['activityTitle', 3, 80, 'Activity title needs at least 3 characters.', 'Keep the activity title to 80 characters.', 'Whale watching cruise'],
  ['displayName', 2, 40, 'Display name needs at least 2 characters.', 'Keep the display name to 40 characters.', 'Pat Jones'],
];
describe.each(textCases)('%s', (field, min, max, shortMsg, longMsg, example) => {
  test('valid example', () => {
    expect(vf(field, example)).toEqual({ ok: true, value: example });
  });
  test('at the minimum', () => {
    expect(vf(field, rep('a', min)).ok).toBe(true);
  });
  test('one under the minimum', () => {
    expect(vf(field, rep('a', min - 1))).toEqual({ ok: false, value: rep('a', min - 1), error: shortMsg });
  });
  test('empty and whitespace only', () => {
    expect(vf(field, '').error).toBe(shortMsg);
    expect(vf(field, '     ').error).toBe(shortMsg);
    expect(vf(field, null).error).toBe(shortMsg);
    expect(vf(field, undefined).error).toBe(shortMsg);
  });
  test('at the maximum', () => {
    expect(vf(field, rep('a', max)).ok).toBe(true);
  });
  test('one over the maximum', () => {
    const r = vf(field, rep('a', max + 1));
    expect(r.ok).toBe(false);
    expect(r.error).toBe(longMsg);
  });
  test('spaces collapse before counting', () => {
    const r = vf(field, `  ${rep('a', min)}    ${rep('b', 1)}  `);
    expect(r.value).toBe(`${rep('a', min)} b`);
  });
  test('padding spaces do not count toward the minimum', () => {
    expect(vf(field, ` ${rep('a', min - 1)} `).ok).toBe(false);
  });
  test('control characters are rejected with a fix', () => {
    const r = vf(field, `${example}\n`);
    expect(r.ok).toBe(false);
    expect(r.error).toMatch(/cannot contain .*Remove them/);
    expect(vf(field, `${example}\t${example}`).ok).toBe(false);
  });
  test('counts characters, not UTF-16 units', () => {
    // Each emoji is one character but two UTF-16 units.
    expect(vf(field, rep('\u{1F600}', max)).ok).toBe(true);
    expect(vf(field, rep('\u{1F600}', max + 1)).ok).toBe(false);
  });
});

describe('startDate', () => {
  test('valid', () => {
    expect(vf('startDate', '2026-10-10')).toEqual({ ok: true, value: '2026-10-10' });
    expect(vf('startDate', '2028-02-29').ok).toBe(true);
  });
  test('missing or impossible', () => {
    for (const bad of ['', '  ', null, undefined, '2026-02-29', '2026-13-01', '10/10/2026', 'Oct 10']) {
      expect(vf('startDate', bad).error).toBe('Choose a start date.');
    }
  });
});

describe('endDate', () => {
  const ctx = { startDate: '2026-10-10' };
  test('same day and after', () => {
    expect(vf('endDate', '2026-10-10', ctx).ok).toBe(true);
    expect(vf('endDate', '2026-10-14', ctx)).toEqual({ ok: true, value: '2026-10-14' });
  });
  test('before the start date', () => {
    expect(vf('endDate', '2026-10-09', ctx).error).toBe('End date is before the start date.');
  });
  test('across a year boundary, end before start', () => {
    expect(vf('endDate', '2026-12-31', { startDate: '2027-01-01' }).error).toBe('End date is before the start date.');
    expect(vf('endDate', '2027-01-02', { startDate: '2026-12-30' }).ok).toBe(true);
  });
  test('missing or impossible end date', () => {
    expect(vf('endDate', '', ctx).error).toBe('Choose an end date.');
    expect(vf('endDate', '2026-02-30', ctx).error).toBe('Choose an end date.');
  });
  test('exactly 30 days is fine, 31 days warns and still saves', () => {
    expect(vf('endDate', '2026-11-08', ctx)).toEqual({ ok: true, value: '2026-11-08' }); // 30 days inclusive
    const r = vf('endDate', '2026-11-09', ctx); // 31 days
    expect(r.ok).toBe(true);
    expect(r.warning).toMatch(/31 days long/);
  });
  test('30-day warning across a daylight saving change', () => {
    // Oct 20 to Nov 18 inclusive is 30 days, Nov 19 is 31, and Nov 1 is the fall change.
    expect(vf('endDate', '2026-11-18', { startDate: '2026-10-20' }).warning).toBeUndefined();
    expect(vf('endDate', '2026-11-19', { startDate: '2026-10-20' }).warning).toMatch(/31 days/);
  });
  test('without a start date, only the end date itself is checked', () => {
    expect(vf('endDate', '2026-10-10').ok).toBe(true);
    expect(vf('endDate', '2026-10-10', { startDate: 'junk' }).ok).toBe(true);
  });
});

describe('votingDeadline', () => {
  const ctx = { now: NOW, timeZone: TZ };
  test('future deadline returns an ISO instant', () => {
    const r = vf('votingDeadline', '2026-10-05T21:00', ctx);
    expect(r).toEqual({ ok: true, value: '2026-10-06T01:00:00.000Z' });
  });
  test('past deadline', () => {
    expect(vf('votingDeadline', '2026-09-29T21:00', ctx).error).toBe('Choose a deadline that has not passed.');
  });
  test('exactly now is not in the future, one minute later is', () => {
    expect(vf('votingDeadline', '2026-09-30T12:00', ctx).ok).toBe(false);
    expect(vf('votingDeadline', '2026-09-30T12:01', ctx).ok).toBe(true);
  });
  test('missing or malformed', () => {
    for (const bad of ['', null, 'soon', '2026-10-05', '2026-13-05T10:00']) {
      expect(vf('votingDeadline', bad, ctx).error).toBe('Choose a deadline that has not passed.');
    }
  });
  test('the clock can be a function, a Date, or a number', () => {
    expect(vf('votingDeadline', '2026-10-05T21:00', { now: () => NOW, timeZone: TZ }).ok).toBe(true);
    expect(vf('votingDeadline', '2026-10-05T21:00', { now: new Date(NOW), timeZone: TZ }).ok).toBe(true);
    expect(vf('votingDeadline', '2026-10-05T21:00', { now: Date.parse('2026-12-01T00:00:00Z'), timeZone: TZ }).ok).toBe(false);
  });
  test('the same wall time is in the past in one zone and the future in another', () => {
    // 2026-09-30T14:00 local: 18:00Z in New York (future of 16:00Z), but 05:00Z in Tokyo (past).
    expect(vf('votingDeadline', '2026-09-30T14:00', { now: NOW, timeZone: 'America/New_York' }).ok).toBe(true);
    expect(vf('votingDeadline', '2026-09-30T14:00', { now: NOW, timeZone: 'Asia/Tokyo' }).ok).toBe(false);
  });
  test('an explicit offset is respected', () => {
    expect(vf('votingDeadline', '2026-10-06T01:00:00Z', ctx).value).toBe('2026-10-06T01:00:00.000Z');
    expect(vf('votingDeadline', '2026-09-30T11:00:00-04:00', ctx).ok).toBe(false);
  });
  test('deadline after the start date warns, on or before does not', () => {
    const c = { ...ctx, startDate: '2026-10-10' };
    expect(vf('votingDeadline', '2026-10-09T23:59', c).warning).toBeUndefined();
    expect(vf('votingDeadline', '2026-10-10T20:00', c).warning).toBeUndefined();
    expect(vf('votingDeadline', '2026-10-11T00:01', c).warning).toMatch(/after the start date/);
  });
  test('start date comparison uses the local calendar day, across UTC midnight', () => {
    // 9 PM on Oct 10 in New York is Oct 11 in UTC. It is still the start date locally.
    const c = { ...ctx, startDate: '2026-10-10' };
    expect(vf('votingDeadline', '2026-10-10T21:00', c).warning).toBeUndefined();
  });
  test('daylight saving: a deadline on the fall change day', () => {
    const c = { now: NOW, timeZone: TZ };
    expect(vf('votingDeadline', '2026-11-01T01:30', c).value).toBe('2026-11-01T05:30:00.000Z');
    expect(vf('votingDeadline', '2026-11-01T21:00', c).value).toBe('2026-11-02T02:00:00.000Z');
  });
});

describe('itinerarySize', () => {
  test('valid values and limits', () => {
    expect(vf('itinerarySize', '6')).toEqual({ ok: true, value: 6 });
    expect(vf('itinerarySize', 6)).toEqual({ ok: true, value: 6 });
    expect(vf('itinerarySize', '1').value).toBe(1);
    expect(vf('itinerarySize', '30').value).toBe(30);
    expect(vf('itinerarySize', ' 12 ').value).toBe(12);
  });
  test('one past each limit and junk', () => {
    const msg = 'Enter a whole number from 1 to 30.';
    for (const bad of ['0', '31', '-1', '6.5', '1e1', 'six', '', '  ', null, undefined, 0, 31, 6.5, '+5', '1 2', '1000']) {
      expect(vf('itinerarySize', bad).error).toBe(msg);
    }
  });
  test('the typed text is kept on error', () => {
    expect(vf('itinerarySize', '31').value).toBe('31');
  });
});

describe('activityDescription', () => {
  const msg = 'Keep the description to 140 characters.';
  test('optional', () => {
    expect(vf('activityDescription', '')).toEqual({ ok: true, value: '' });
    expect(vf('activityDescription', undefined).ok).toBe(true);
    expect(vf('activityDescription', '   ').value).toBe('');
  });
  test('valid, at the limit, one past', () => {
    expect(vf('activityDescription', 'Three hours, departs 9 AM').ok).toBe(true);
    expect(vf('activityDescription', rep('a', 140)).ok).toBe(true);
    expect(vf('activityDescription', rep('a', 141)).error).toBe(msg);
  });
  test('spaces collapse before counting', () => {
    expect(vf('activityDescription', rep('a ', 70).trim() + '      ').ok).toBe(true);
  });
  test('control characters rejected', () => {
    expect(vf('activityDescription', 'line one\nline two').ok).toBe(false);
  });
});

describe('sourceUrl', () => {
  const msg = 'Enter a full web address beginning with https://.';
  test('optional', () => {
    expect(vf('sourceUrl', '')).toEqual({ ok: true, value: '' });
    expect(vf('sourceUrl', null).ok).toBe(true);
    expect(vf('sourceUrl', '  ').value).toBe('');
  });
  test('valid forms', () => {
    for (const ok of ['https://example.com/cruise', 'http://example.com', 'https://a.co/x?y=1&z=2#top', 'https://localhost:8080/a']) {
      expect(vf('sourceUrl', ok)).toEqual({ ok: true, value: ok });
    }
  });
  test('invalid forms', () => {
    for (const bad of ['example.com', 'www.example.com/cruise', 'ftp://example.com', 'https://', 'http://', 'https:// example.com', 'https://exa mple.com', 'javascript:alert(1)', 'https:/example.com', '//example.com']) {
      expect(vf('sourceUrl', bad).error).toBe(msg);
    }
  });
  test('length limit of 500', () => {
    const base = 'https://example.com/';
    expect(vf('sourceUrl', base + rep('a', 500 - base.length)).ok).toBe(true);
    expect(vf('sourceUrl', base + rep('a', 501 - base.length)).error).toBe('Keep the web address to 500 characters.');
  });
  test('control characters rejected', () => {
    expect(vf('sourceUrl', 'https://example.com/\u0007').ok).toBe(false);
    expect(vf('sourceUrl', 'https://example.com/\n').ok).toBe(false);
  });
  test('surrounding spaces are trimmed', () => {
    expect(vf('sourceUrl', '  https://example.com  ').value).toBe('https://example.com');
  });
});

describe('email', () => {
  const msg = 'That email address looks incomplete.';
  test('lowercases and trims', () => {
    expect(vf('email', '  Pat@Example.COM ')).toEqual({ ok: true, value: 'pat@example.com' });
  });
  test('valid forms', () => {
    for (const ok of ['pat@example.com', 'pat.jones+trip@mail.example.co.uk', 'a@b.io']) {
      expect(vf('email', ok).ok).toBe(true);
    }
  });
  test('incomplete forms', () => {
    for (const bad of ['', 'pat', 'pat@', '@example.com', 'pat@example', 'pat@example.', 'pat@@example.com', 'pat example@x.com', 'pat@exa mple.com', 'pat..j@example.com', '.pat@example.com', 'pat.@example.com', 'pat@example..com', 'pat@example.c', 'a@b.c,d@e.fg']) {
      expect(vf('email', bad).error).toBe(msg);
    }
  });
  test('length limit', () => {
    expect(vf('email', rep('a', 250) + '@b.co').ok).toBe(false);
  });
  test('null', () => {
    expect(vf('email', null).error).toBe(msg);
  });
});

describe('deleteConfirm', () => {
  const msg = 'Type the trip name exactly to delete.';
  test('exact match', () => {
    expect(vf('deleteConfirm', 'Cape Cod, October', { tripName: 'Cape Cod, October' }).ok).toBe(true);
  });
  test('extra spaces around and inside are cleaned before comparing', () => {
    expect(vf('deleteConfirm', '  Cape   Cod, October ', { tripName: 'Cape Cod, October' }).ok).toBe(true);
  });
  test('case differences, partial, empty, missing trip name', () => {
    expect(vf('deleteConfirm', 'cape cod, october', { tripName: 'Cape Cod, October' }).error).toBe(msg);
    expect(vf('deleteConfirm', 'Cape Cod', { tripName: 'Cape Cod, October' }).error).toBe(msg);
    expect(vf('deleteConfirm', '', { tripName: 'Cape Cod, October' }).error).toBe(msg);
    expect(vf('deleteConfirm', 'x', {}).error).toBe(msg);
    expect(vf('deleteConfirm', '', { tripName: '' }).error).toBe(msg);
  });
});

test('unknown field name throws', () => {
  expect(() => vf('nope', 'x')).toThrow();
});

describe('validateTripForm', () => {
  const good = () => ({
    tripName: 'Cape Cod, October',
    destination: 'Provincetown, MA',
    startDate: '2026-10-10',
    endDate: '2026-10-14',
    votingDeadline: '2026-10-05T21:00',
    itinerarySize: '2',
    organizerName: 'Pat Jones',
    now: NOW,
    timeZone: TZ,
    activities: [
      { title: 'Whale watching cruise', description: 'Three hours, departs 9 AM', sourceUrl: 'https://example.com/cruise' },
      { title: 'Beach day', description: '', sourceUrl: '' },
      { title: 'Lobster dinner', description: '', sourceUrl: '' },
    ],
  });

  test('a good form passes and returns the create_trip shape', () => {
    const r = validateTripForm(good());
    expect(r.ok).toBe(true);
    expect(r.errors).toEqual({});
    expect(r.warnings).toEqual({});
    expect(r.value).toEqual({
      name: 'Cape Cod, October',
      destination: 'Provincetown, MA',
      start_date: '2026-10-10',
      end_date: '2026-10-14',
      voting_deadline: '2026-10-06T01:00:00.000Z',
      itinerary_size: 2,
      organizer_name: 'Pat Jones',
      activities: [
        { title: 'Whale watching cruise', description: 'Three hours, departs 9 AM', source_url: 'https://example.com/cruise' },
        { title: 'Beach day', description: null, source_url: null },
        { title: 'Lobster dinner', description: null, source_url: null },
      ],
    });
  });

  test('an empty form reports every required field, keyed by test id', () => {
    const r = validateTripForm({ now: NOW, timeZone: TZ, activities: [{}, {}, {}] });
    expect(r.ok).toBe(false);
    expect(Object.keys(r.errors).sort()).toEqual([
      'activity-title-0', 'activity-title-1', 'activity-title-2', 'destination', 'end-date',
      'itinerary-size', 'organizer-name', 'start-date', 'trip-name', 'voting-deadline',
    ].sort());
    expect(r.errors['trip-name']).toBe('Trip name needs at least 3 characters.');
    expect(r.errors['start-date']).toBe('Choose a start date.');
    expect(r.errors['itinerary-size']).toBe('Enter a whole number from 1 to 30.');
  });

  test('no form at all does not throw', () => {
    const r = validateTripForm();
    expect(r.ok).toBe(false);
    expect(r.errors.activities).toBe('Add at least 3 activities.');
  });

  test('fewer than 3 and more than 10 activities', () => {
    const f = good();
    f.activities = f.activities.slice(0, 2);
    expect(validateTripForm(f).errors.activities).toBe('Add at least 3 activities.');
    f.activities = Array.from({ length: 10 }, (_, i) => ({ title: `Activity ${i}` }));
    expect(validateTripForm(f).ok).toBe(true);
    f.activities.push({ title: 'Activity 10' });
    expect(validateTripForm(f).errors.activities).toBe('Add no more than 10 activities.');
  });

  test('errors point at the right activity row', () => {
    const f = good();
    f.activities[1] = { title: 'ab', description: rep('x', 141), sourceUrl: 'nope' };
    const r = validateTripForm(f);
    expect(r.errors['activity-title-1']).toBe('Activity title needs at least 3 characters.');
    expect(r.errors['activity-description-1']).toBe('Keep the description to 140 characters.');
    expect(r.errors['activity-source-1']).toBe('Enter a full web address beginning with https://.');
    expect(r.errors['activity-title-0']).toBeUndefined();
  });

  test('end before start and deadline in the past', () => {
    const f = good();
    f.endDate = '2026-10-09';
    f.votingDeadline = '2026-09-01T10:00';
    const r = validateTripForm(f);
    expect(r.errors['end-date']).toBe('End date is before the start date.');
    expect(r.errors['voting-deadline']).toBe('Choose a deadline that has not passed.');
  });

  test('a missing start date does not hide the end date error message logic', () => {
    const f = good();
    f.startDate = '';
    const r = validateTripForm(f);
    expect(r.errors['start-date']).toBe('Choose a start date.');
    expect(r.errors['end-date']).toBeUndefined();
  });

  test('warnings do not block: long trip and late deadline', () => {
    const f = good();
    f.endDate = '2026-11-20';
    f.votingDeadline = '2026-10-12T10:00';
    const r = validateTripForm(f);
    expect(r.ok).toBe(true);
    expect(r.warnings['end-date']).toMatch(/42 days long/);
    expect(r.warnings['voting-deadline']).toMatch(/after the start date/);
  });

  test('values are cleaned: spaces collapse, source link trimmed', () => {
    const f = good();
    f.tripName = '  Cape   Cod  ';
    f.activities[0].sourceUrl = ' https://example.com/cruise ';
    const r = validateTripForm(f);
    expect(r.value.name).toBe('Cape Cod');
    expect(r.value.activities[0].source_url).toBe('https://example.com/cruise');
  });

  test('itinerary size larger than the activity count is allowed', () => {
    const f = good();
    f.itinerarySize = '30';
    expect(validateTripForm(f).ok).toBe(true);
  });

  test('snake_case source_url on an activity is accepted', () => {
    const f = good();
    f.activities[0] = { title: 'Whale watching cruise', source_url: 'https://example.com/x' };
    expect(validateTripForm(f).value.activities[0].source_url).toBe('https://example.com/x');
  });

  test('typed values stay available on error', () => {
    const f = good();
    f.tripName = 'ab';
    expect(validateTripForm(f).value.name).toBe('ab');
  });
});

describe('parseInviteList', () => {
  test('splits on commas, spaces, semicolons, and line breaks', () => {
    const r = parseInviteList('a@x.com, b@x.com;c@x.com\nd@x.com   e@x.com');
    expect(r.map((e) => e.email)).toEqual(['a@x.com', 'b@x.com', 'c@x.com', 'd@x.com', 'e@x.com']);
    expect(r.every((e) => e.status === 'will_invite')).toBe(true);
  });
  test('duplicates are merged and listed, case-insensitively', () => {
    const r = parseInviteList('Pat@x.com pat@x.com PAT@X.COM');
    expect(r.map((e) => e.status)).toEqual(['will_invite', 'duplicate', 'duplicate']);
  });
  test('invalid entries are listed, not dropped', () => {
    const r = parseInviteList('good@x.com, nope, @bad, other@x.com');
    expect(r.map((e) => e.status)).toEqual(['will_invite', 'invalid', 'invalid', 'will_invite']);
    expect(r[1].raw).toBe('nope');
  });
  test('empty and null', () => {
    expect(parseInviteList('')).toEqual([]);
    expect(parseInviteList(null)).toEqual([]);
    expect(parseInviteList(' ,; \n ')).toEqual([]);
  });
});
