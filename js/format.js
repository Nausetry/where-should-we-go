// Display formatting. Pure functions, no DOM.
// Every function that depends on a time zone or the current time accepts an
// optional time zone (IANA name) and, where relevant, a clock, so tests are
// deterministic. With no time zone given, the viewer's own time zone is used.

const DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;
const LOCAL_DT_RE = /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})(?::(\d{2}))?$/;
const ZONED_DT_RE = /^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?(?:Z|[+-]\d{2}(?::?\d{2})?)$/i;
const MS_PER_DAY = 86400000;

/** Current time in milliseconds. `clock` may be a Date, a number, or a function. */
export function nowMs(clock) {
  if (clock === undefined || clock === null) return Date.now();
  if (typeof clock === 'function') return nowMs(clock());
  if (clock instanceof Date) return clock.getTime();
  return Number(clock);
}

/** Parse "YYYY-MM-DD" into a UTC millisecond value, or null if it is not a real calendar date. */
export function parseDateOnly(s) {
  if (typeof s !== 'string') return null;
  const m = DATE_RE.exec(s.trim());
  if (!m) return null;
  const y = +m[1], mo = +m[2], d = +m[3];
  if (mo < 1 || mo > 12 || d < 1) return null;
  const ms = Date.UTC(y, mo - 1, d);
  const back = new Date(ms);
  if (back.getUTCFullYear() !== y || back.getUTCMonth() !== mo - 1 || back.getUTCDate() !== d) return null;
  return ms;
}

function cleanSpaces(s) {
  // Newer ICU builds put a narrow no-break space before AM and PM. Use a plain space.
  return s.replace(/[  ]/g, ' ');
}

function dateOnlyFormatter(opts) {
  return new Intl.DateTimeFormat('en-US', { timeZone: 'UTC', ...opts });
}

/** Inclusive number of days from start to end, both "YYYY-MM-DD". NaN if either is invalid. */
export function dayCount(startIso, endIso) {
  const a = parseDateOnly(datePart(startIso));
  const b = parseDateOnly(datePart(endIso));
  if (a === null || b === null) return NaN;
  return Math.round((b - a) / MS_PER_DAY) + 1;
}

function datePart(iso) {
  return typeof iso === 'string' ? iso.slice(0, 10) : '';
}

/** "Sat, Oct 10, 2026" */
export function formatDate(iso) {
  const ms = parseDateOnly(datePart(iso));
  if (ms === null) return '';
  return dateOnlyFormatter({ weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }).format(ms);
}

/** "Sat, Oct 10 to Wed, Oct 14, 2026, 5 days" */
export function formatRange(startIso, endIso) {
  const a = parseDateOnly(datePart(startIso));
  const b = parseDateOnly(datePart(endIso));
  if (a === null || b === null) return '';
  const days = dayCount(startIso, endIso);
  const unit = plural(days, 'day', 'days');
  const sameYear = new Date(a).getUTCFullYear() === new Date(b).getUTCFullYear();
  if (a === b) return `${formatDate(startIso)}, ${unit}`;
  const left = sameYear
    ? dateOnlyFormatter({ weekday: 'short', month: 'short', day: 'numeric' }).format(a)
    : formatDate(startIso);
  return `${left} to ${formatDate(endIso)}, ${unit}`;
}

function instantFormatter(timeZone) {
  const opts = {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: 'numeric', minute: '2-digit', timeZoneName: 'short',
  };
  if (timeZone) opts.timeZone = timeZone;
  return new Intl.DateTimeFormat('en-US', opts);
}

function formatInstant(iso, timeZone) {
  if (iso === null || iso === undefined || iso === '') return '';
  const ms = iso instanceof Date ? iso.getTime() : Date.parse(iso);
  if (Number.isNaN(ms)) return '';
  return cleanSpaces(instantFormatter(timeZone).format(ms));
}

/** "Oct 5, 2026, 9:00 PM EDT" in the viewer's time zone (or the one given). */
export function formatDeadline(iso, timeZone) {
  return formatInstant(iso, timeZone);
}

/** "Oct 3, 2026, 2:14 PM EDT" */
export function formatAsOf(iso, timeZone) {
  return formatInstant(iso, timeZone);
}

/** "1 vote", "7 votes". `many` defaults to `one` plus "s". */
export function plural(n, one, many) {
  const word = n === 1 ? one : (many === undefined ? one + 's' : many);
  const shown = Number.isFinite(n) ? n.toLocaleString('en-US') : String(n);
  return `${shown} ${word}`;
}

/** Name of the viewer's time zone, for labels such as "Times shown in America/New_York". */
export function viewerTimeZone() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || '';
  } catch {
    return '';
  }
}

// ---------------------------------------------------------------------------
// Time zone helpers used by validation and by the create form.

// Offset in milliseconds of `timeZone` from UTC at the instant `ms` (east is positive).
function zoneOffsetMs(ms, timeZone) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone, hourCycle: 'h23',
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  }).formatToParts(ms);
  const get = (t) => +parts.find((p) => p.type === t).value;
  const asUtc = Date.UTC(get('year'), get('month') - 1, get('day'), get('hour') % 24, get('minute'), get('second'));
  return asUtc - Math.floor(ms / 1000) * 1000;
}

/**
 * Convert a wall-clock time ("YYYY-MM-DDTHH:mm", as a datetime-local input gives)
 * to an instant in milliseconds. Uses `timeZone` if given, otherwise the viewer's
 * zone. A string that already carries Z or an offset is used as is.
 * Returns null when the text is not a real date and time.
 * A time skipped by daylight saving moves to just after the gap. A repeated time uses its first occurrence.
 */
export function parseDateTime(text, timeZone) {
  if (typeof text !== 'string') return null;
  const s = text.trim();
  if (ZONED_DT_RE.test(s)) {
    const ms = Date.parse(s.replace(' ', 'T'));
    return Number.isNaN(ms) ? null : ms;
  }
  const m = LOCAL_DT_RE.exec(s);
  if (!m) return null;
  const [y, mo, d, h, mi] = [+m[1], +m[2], +m[3], +m[4], +m[5]];
  const sec = m[6] ? +m[6] : 0;
  if (h > 23 || mi > 59 || sec > 59) return null;
  if (parseDateOnly(`${m[1]}-${m[2]}-${m[3]}`) === null) return null;
  if (!timeZone) {
    const local = new Date(y, mo - 1, d, h, mi, sec);
    return Number.isNaN(local.getTime()) ? null : local.getTime();
  }
  const guess = Date.UTC(y, mo - 1, d, h, mi, sec);
  const off1 = zoneOffsetMs(guess, timeZone);
  const t1 = guess - off1;
  const off2 = zoneOffsetMs(t1, timeZone);
  if (off2 === off1) return t1;
  const t2 = guess - off2;
  if (zoneOffsetMs(t2, timeZone) === off2) return t2;
  return Math.max(t1, t2); // the wall time was skipped by daylight saving: use the time just after the gap
}

/** Calendar date ("YYYY-MM-DD") of an instant as seen in `timeZone` (or the viewer's zone). */
export function dateInZone(ms, timeZone) {
  const opts = { year: 'numeric', month: '2-digit', day: '2-digit' };
  if (timeZone) opts.timeZone = timeZone;
  const parts = new Intl.DateTimeFormat('en-US', opts).formatToParts(ms);
  const get = (t) => parts.find((p) => p.type === t).value;
  return `${get('year')}-${get('month')}-${get('day')}`;
}

/** Format an instant as the value a datetime-local input expects ("YYYY-MM-DDTHH:mm"). */
export function toLocalInput(iso, timeZone) {
  const ms = iso instanceof Date ? iso.getTime() : Date.parse(iso);
  if (Number.isNaN(ms)) return '';
  const opts = {
    hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit',
  };
  if (timeZone) opts.timeZone = timeZone;
  const parts = new Intl.DateTimeFormat('en-US', opts).formatToParts(ms);
  const get = (t) => parts.find((p) => p.type === t).value;
  return `${get('year')}-${get('month')}-${get('day')}T${get('hour') === '24' ? '00' : get('hour')}:${get('minute')}`;
}
