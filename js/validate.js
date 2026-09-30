// Input rules. Pure functions, no DOM. Wording of errors is PRD section 8.
// Messages the PRD does not list (upper limits, control characters, missing end date)
// follow the same pattern: name the problem and the fix.
import { parseDateOnly, parseDateTime, dayCount, dateInZone, nowMs } from './format.js';

export const LIMITS = {
  tripName: [3, 60],
  destination: [2, 60],
  itinerarySize: [1, 30],
  activityTitle: [3, 80],
  activityDescription: [0, 140],
  sourceUrl: [0, 500],
  displayName: [2, 40],
  email: [0, 254],
  activitiesAtCreate: [3, 10],
  longTripDays: 30,
};

// Control characters plus invisible and direction-control characters (zero-width spaces,
// right-to-left overrides). Matches the database rule in migration 0002.
const CONTROL_RE = /[\u0000-\u001F\u007F-\u009F\u00AD\u034F\u061C\u115F\u1160\u17B4\u17B5\u180B-\u180E\u200B-\u200F\u2028-\u202E\u2060-\u206F\u3164\uFE00-\uFE0F\uFEFF\uFFA0\uFFF9-\uFFFC]/;
const SPACE_RUN_RE = /[    -   　]+/g;
const URL_RE = /^https?:\/\/[^\s\u0000-\u001F\u007F-\u009F\u00AD\u034F\u061C\u115F\u1160\u17B4\u17B5\u180B-\u180E\u2028-\u202E\u200B-\u200F\u2060-\u206F\u3164\uFE00-\uFE0F\uFEFF\uFFA0\uFFF9-\uFFFC]+$/;
const EMAIL_RE = /^[^\s@,;<>()[\]\\"]+@[^\s@,;<>()[\]\\"]+\.[^\s@,;<>()[\]\\".]{2,}$/;

function len(s) {
  return [...s].length; // count characters the way the database does, not UTF-16 units
}

/**
 * Trim, collapse repeated spaces to one, and flag control characters.
 * Returns { value, hadControl }. Control characters are left in `value`
 * so the page can show what was typed; callers reject when `hadControl` is true.
 */
export function normalizeText(s) {
  const str = s === null || s === undefined ? '' : String(s);
  return {
    value: str.replace(SPACE_RUN_RE, ' ').trim(),
    hadControl: CONTROL_RE.test(str),
  };
}

const LABELS = {
  tripName: 'Trip name',
  destination: 'Destination',
  activityTitle: 'Activity title',
  activityDescription: 'Description',
  sourceUrl: 'Web address',
  displayName: 'Display name',
  email: 'Email address',
};

function controlError(name) {
  return `${LABELS[name] || 'This field'} cannot contain line breaks, tabs, or other hidden characters. Remove them and try again.`;
}

function fail(value, error) {
  return { ok: false, value, error };
}
function pass(value, warning) {
  return warning ? { ok: true, value, warning } : { ok: true, value };
}

function textField(name, value, [min, max], messages) {
  const { value: v, hadControl } = normalizeText(value);
  if (hadControl) return fail(v, controlError(name));
  const n = len(v);
  if (n < min) return fail(v, messages.short);
  if (n > max) return fail(v, messages.long);
  return pass(v);
}

function clockOf(ctx) {
  return nowMs(ctx && ctx.now);
}

/**
 * Validate one field.
 * name: tripName, destination, startDate, endDate, votingDeadline, itinerarySize,
 *       activityTitle, activityDescription, sourceUrl, displayName, email, deleteConfirm
 * ctx:  { startDate, now, timeZone, tripName } as needed
 * Returns { ok, value, error?, warning? }. `value` is the cleaned value to store.
 */
export function validateField(name, value, ctx = {}) {
  switch (name) {
    case 'tripName':
      return textField(name, value, LIMITS.tripName, {
        short: 'Trip name needs at least 3 characters.',
        long: 'Keep the trip name to 60 characters.',
      });

    case 'destination':
      return textField(name, value, LIMITS.destination, {
        short: 'Enter a destination, for example Provincetown, MA.',
        long: 'Keep the destination to 60 characters.',
      });

    case 'startDate': {
      const v = typeof value === 'string' ? value.trim() : '';
      if (parseDateOnly(v) === null) return fail(v, 'Choose a start date.');
      return pass(v);
    }

    case 'endDate': {
      const v = typeof value === 'string' ? value.trim() : '';
      if (parseDateOnly(v) === null) return fail(v, 'Choose an end date.');
      const start = ctx.startDate && parseDateOnly(String(ctx.startDate).trim()) !== null ? String(ctx.startDate).trim() : null;
      if (start) {
        const days = dayCount(start, v);
        if (days < 1) return fail(v, 'End date is before the start date.');
        if (days > LIMITS.longTripDays) {
          return pass(v, `This trip is ${days} days long, more than 30 days. Check the dates. It will still save.`);
        }
      }
      return pass(v);
    }

    case 'votingDeadline': {
      const msg = 'Choose a deadline that has not passed.';
      const v = typeof value === 'string' ? value.trim() : '';
      const ms = parseDateTime(v, ctx.timeZone);
      if (ms === null || ms <= clockOf(ctx)) return fail(v, msg);
      const iso = new Date(ms).toISOString();
      const start = ctx.startDate && parseDateOnly(String(ctx.startDate).trim()) !== null ? String(ctx.startDate).trim() : null;
      if (start && dateInZone(ms, ctx.timeZone) > start) {
        return pass(iso, 'The deadline is after the start date. Voting will still be open when the trip begins.');
      }
      return pass(iso);
    }

    case 'itinerarySize': {
      const msg = 'Enter a whole number from 1 to 30.';
      const raw = typeof value === 'number' ? String(value) : (typeof value === 'string' ? value.trim() : '');
      if (!/^\d{1,3}$/.test(raw)) return fail(raw, msg);
      const n = Number(raw);
      if (n < LIMITS.itinerarySize[0] || n > LIMITS.itinerarySize[1]) return fail(raw, msg);
      return pass(n);
    }

    case 'activityTitle':
      return textField(name, value, LIMITS.activityTitle, {
        short: 'Activity title needs at least 3 characters.',
        long: 'Keep the activity title to 80 characters.',
      });

    case 'activityDescription':
      return textField(name, value, LIMITS.activityDescription, {
        short: '',
        long: 'Keep the description to 140 characters.',
      });

    case 'sourceUrl': {
      const { value: v, hadControl } = normalizeText(value);
      if (v === '' && !hadControl) return pass('');
      const msg = 'Enter a full web address beginning with https://.';
      if (hadControl) return fail(v, controlError(name));
      if (len(v) > LIMITS.sourceUrl[1]) return fail(v, 'Keep the web address to 500 characters.');
      if (!URL_RE.test(v)) return fail(v, msg);
      try {
        const u = new URL(v);
        if (!u.hostname) return fail(v, msg);
      } catch {
        return fail(v, msg);
      }
      return pass(v);
    }

    case 'displayName':
      return textField(name, value, LIMITS.displayName, {
        short: 'Display name needs at least 2 characters.',
        long: 'Keep the display name to 40 characters.',
      });

    case 'email': {
      const msg = 'That email address looks incomplete.';
      const { value: trimmed, hadControl } = normalizeText(value);
      const v = trimmed.toLowerCase();
      if (hadControl) return fail(v, msg);
      if (len(v) > LIMITS.email[1] || !EMAIL_RE.test(v) || v.includes('..') || v.startsWith('.') || v.split('@')[0].endsWith('.')) {
        return fail(v, msg);
      }
      return pass(v);
    }

    case 'deleteConfirm': {
      const { value: v } = normalizeText(value);
      const target = ctx.tripName === undefined || ctx.tripName === null ? null : String(ctx.tripName);
      if (target === null || target === '' || v !== target) return fail(v, 'Type the trip name exactly to delete.');
      return pass(v);
    }

    default:
      throw new Error(`Unknown field: ${name}`);
  }
}

/**
 * Validate the whole create form.
 * form = { tripName, destination, startDate, endDate, votingDeadline, itinerarySize,
 *          organizerName, activities: [{ title, description, sourceUrl }],
 *          now?, timeZone? }
 * Returns { ok, errors, warnings, value }. The keys of `errors` and `warnings` are
 * the field test ids: trip-name, destination, start-date, end-date, voting-deadline,
 * itinerary-size, organizer-name, activity-title-N, activity-description-N,
 * activity-source-N, and `activities` for the activity count.
 * `value` has the shape create_trip expects (snake_case), without the voter id.
 */
export function validateTripForm(form = {}) {
  const errors = {};
  const warnings = {};
  const ctxBase = { now: form.now, timeZone: form.timeZone };

  const take = (id, result) => {
    if (!result.ok) errors[id] = result.error;
    else if (result.warning) warnings[id] = result.warning;
    return result.value;
  };

  const name = take('trip-name', validateField('tripName', form.tripName));
  const destination = take('destination', validateField('destination', form.destination));
  const start = validateField('startDate', form.startDate);
  const startDate = take('start-date', start);
  const ctx = { ...ctxBase, startDate: start.ok ? start.value : undefined };
  const endDate = take('end-date', validateField('endDate', form.endDate, ctx));
  const votingDeadline = take('voting-deadline', validateField('votingDeadline', form.votingDeadline, ctx));
  const itinerarySize = take('itinerary-size', validateField('itinerarySize', form.itinerarySize));
  const organizerName = take('organizer-name', validateField('displayName', form.organizerName));

  const rows = Array.isArray(form.activities) ? form.activities : [];
  const activities = rows.map((row, i) => {
    const r = row || {};
    const title = take(`activity-title-${i}`, validateField('activityTitle', r.title));
    const description = take(`activity-description-${i}`, validateField('activityDescription', r.description));
    const sourceUrl = take(`activity-source-${i}`, validateField('sourceUrl', r.sourceUrl ?? r.source_url));
    return { title, description, source_url: sourceUrl };
  });
  const [minRows, maxRows] = LIMITS.activitiesAtCreate;
  if (rows.length < minRows) errors.activities = 'Add at least 3 activities.';
  else if (rows.length > maxRows) errors.activities = 'Add no more than 10 activities.';

  const value = {
    name,
    destination,
    start_date: startDate,
    end_date: endDate,
    voting_deadline: votingDeadline,
    itinerary_size: itinerarySize,
    organizer_name: organizerName,
    activities: activities.map((a) => ({
      title: a.title,
      description: a.description === '' ? null : a.description,
      source_url: a.source_url === '' ? null : a.source_url,
    })),
  };
  return { ok: Object.keys(errors).length === 0, errors, warnings, value };
}

/**
 * Release 2. Split pasted text on commas, spaces, semicolons, and line breaks.
 * Returns [{ raw, email, status }] in the order entered, with status
 * 'will_invite', 'duplicate', or 'invalid'. Nothing is dropped.
 */
export function parseInviteList(text) {
  const parts = String(text ?? '').split(/[\s,;]+/).filter((p) => p.length > 0);
  const seen = new Set();
  return parts.map((raw) => {
    const r = validateField('email', raw);
    if (!r.ok) return { raw, email: r.value, status: 'invalid' };
    if (seen.has(r.value)) return { raw, email: r.value, status: 'duplicate' };
    seen.add(r.value);
    return { raw, email: r.value, status: 'will_invite' };
  });
}
