// Data access for the page. Views call only these functions, never the database.
// Plain ES module, no build step. The Supabase client is loaded on first use from
// the CDN below, so this file also imports cleanly in Node (tests inject a client).
import { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } from '../config.js';
import { formatDeadline } from './format.js';
import { validateField } from './validate.js';

// Pinned and checked against the hosted project (September 30, 2026).
export const SUPABASE_JS_URL = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.117.2/+esm';

// ---------------------------------------------------------------------------
// Errors

const MESSAGES = {
  invalid_input: 'One of the entries was not accepted. Check the form and try again.',
  deadline_passed: 'Choose a deadline that has not passed.',
  trip_not_found: 'No trip found for this link. Check the code and try again.',
  not_a_member: 'Enter your name before voting.',
  voting_closed: 'Voting has closed. Your change was not recorded.',
  activity_not_found: 'That activity no longer exists. The list has been refreshed.',
  too_many_activities: 'A trip can have at most 30 activities.',
  name_mismatch: 'Type the trip name exactly to delete.',
  not_signed_in: 'Sign in to continue.',
  not_invited: 'This email address is not on the invite list. Ask the organizer to add you.',
  not_organizer: 'Only an organizer can do that.',
  last_organizer: 'A trip needs at least one organizer. Make someone else an organizer first.',
  already_claimed: 'This trip has already been claimed.',
  network: 'Could not reach the server. Check your connection and try again.',
  unknown: 'Something went wrong. Try again in a moment.',
};

export const ERROR_CODES = Object.keys(MESSAGES).filter((c) => c !== 'unknown');

const FIELD_WORDS = {
  name: 'trip name',
  destination: 'destination',
  start_date: 'start date',
  end_date: 'end date',
  voting_deadline: 'voting deadline',
  itinerary_size: 'itinerary size',
  organizer_name: 'your name',
  display_name: 'display name',
  title: 'activity title',
  description: 'description',
  source_url: 'web address',
  activities: 'activities',
  voter: 'your name',
  email: 'email address',
};

export class ApiError extends Error {
  constructor(code, message, detail) {
    super(message || MESSAGES[code] || MESSAGES.unknown);
    this.name = 'ApiError';
    this.code = code;
    this.detail = detail === undefined ? '' : detail;
  }
}

function fieldWord(detail) {
  const key = String(detail || '').replace(/\[\d+\]/g, '').split('.').pop().trim();
  return FIELD_WORDS[key] || '';
}

// Wording for "what happened to the thing you tried", by kind of action.
const OUTCOME = { vote: 'Your vote was not recorded.', change: 'Your change was not saved.' };

/**
 * Turn anything thrown or returned by the database layer into an ApiError.
 * `opts.closedAt` (ISO time) and `opts.kind` ('vote' or 'change') sharpen the closed-voting wording.
 */
export function mapError(err, opts = {}) {
  if (err instanceof ApiError) return err;
  const raw = err && typeof err === 'object' ? err : { message: String(err ?? '') };
  const message = String(raw.message ?? '');
  const pgCode = String(raw.code ?? '');
  const status = Number(raw.status ?? raw.statusCode ?? 0);

  // Network failures: fetch rejects, or supabase-js wraps them.
  if (
    /failed to fetch|networkerror|network request failed|load failed|fetch failed|timed out|ECONNRESET|ENOTFOUND|EAI_AGAIN/i.test(message) ||
    raw.name === 'TypeError' && /fetch/i.test(message) ||
    status === 0 && /FetchError|AuthRetryableFetchError/.test(String(raw.name ?? '')) ||
    status === 502 || status === 503 || status === 504
  ) {
    return new ApiError('network', MESSAGES.network, message);
  }

  // Raised by our functions and triggers: message starts with a code, then ": detail".
  const m = /^([a-z_]+)(?::\s*([\s\S]*))?$/.exec(message.trim());
  if (m && ERROR_CODES.includes(m[1])) {
    return build(m[1], (m[2] || '').trim(), opts);
  }
  const inner = ERROR_CODES.find((c) => new RegExp(`(^|[^a-z_])${c}([^a-z_]|$)`).test(message));
  if (inner) return build(inner, '', opts);

  // Database constraint failures mean the value broke a rule the page should have caught.
  if (pgCode === '23514' || pgCode === '22001' || pgCode === '22P02' || pgCode === '22007' || pgCode === '22008') {
    return build('invalid_input', constraintField(raw), opts);
  }
  if (pgCode === '23503') {
    // Foreign key: a vote needs both a member and an activity.
    return build(/members/.test(`${raw.details} ${message}`) ? 'not_a_member' : 'activity_not_found', '', opts);
  }
  if (pgCode === '42501' || status === 401 || status === 403) {
    return new ApiError('not_signed_in', MESSAGES.not_signed_in, message);
  }
  return new ApiError('unknown', MESSAGES.unknown, message);
}

function constraintField(raw) {
  const text = `${raw.message ?? ''} ${raw.details ?? ''}`;
  const m = /constraint "?([a-z_]+?)_(?:check|len|format|range)"?/i.exec(text) || /column "?([a-z_]+)"?/i.exec(text);
  return m ? m[1] : '';
}

function build(code, detail, opts) {
  let message = MESSAGES[code];
  if (code === 'invalid_input' && detail === 'last_activity') {
    message = 'A trip needs at least 1 activity. Add another before removing this one.';
  } else if (code === 'invalid_input') {
    const word = fieldWord(detail);
    message = word
      ? `The ${word} was not accepted. Check it and try again.`
      : MESSAGES.invalid_input;
  } else if (code === 'voting_closed') {
    const when = opts.closedAt ? formatDeadline(opts.closedAt, opts.timeZone) : '';
    const outcome = OUTCOME[opts.kind] || OUTCOME.change;
    message = when ? `Voting closed at ${when}. ${outcome}` : `Voting has closed. ${outcome}`;
  }
  return new ApiError(code, message, detail);
}

// ---------------------------------------------------------------------------
// Client

let client = null;
let clientPromise = null;

/** Tests and Node scripts supply their own client. Pass null to reset. */
export function _setClient(c) {
  client = c;
  clientPromise = null;
}

async function getClient() {
  if (client) return client;
  if (!clientPromise) {
    clientPromise = (async () => {
      const url = SUPABASE_JS_URL; // held in a variable so bundlers and test runners leave the import alone
      const mod = await import(/* @vite-ignore */ url);
      client = mod.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
        auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
        realtime: { params: { eventsPerSecond: 20 } },
      });
      return client;
    })().catch((e) => {
      clientPromise = null;
      throw new ApiError('network', MESSAGES.network, String(e && e.message));
    });
  }
  return clientPromise;
}

async function call(fn, opts) {
  let c;
  try {
    c = await getClient();
  } catch (e) {
    throw mapError(e, opts);
  }
  try {
    const res = await fn(c);
    if (res && res.error) throw res.error;
    return res ? res.data : undefined;
  } catch (e) {
    throw mapError(e, opts);
  }
}

// ---------------------------------------------------------------------------
// Identity in this browser (Release 1)

const VOTER_KEY = 'wsg.voter';
const NAME_KEY = 'wsg.name';
let memoryVoter = '';
let memoryName = '';

function randomHex(bytes) {
  const out = new Uint8Array(bytes);
  const cr = globalThis.crypto;
  if (cr && typeof cr.getRandomValues === 'function') cr.getRandomValues(out);
  else for (let i = 0; i < bytes; i++) out[i] = Math.floor(Math.random() * 256);
  return Array.from(out, (b) => b.toString(16).padStart(2, '0')).join('');
}

function storageGet(key) {
  try {
    return globalThis.localStorage ? globalThis.localStorage.getItem(key) : null;
  } catch {
    return null;
  }
}
function storageSet(key, value) {
  try {
    if (globalThis.localStorage) globalThis.localStorage.setItem(key, value);
  } catch {
    /* private window or blocked storage: the memory copy still works for this page */
  }
}

/** Random id for this browser, kept in localStorage, with a memory fallback. 8 to 64 characters. */
export function getVoterId() {
  if (memoryVoter) return memoryVoter;
  const stored = storageGet(VOTER_KEY);
  if (stored && /^[A-Za-z0-9_-]{8,64}$/.test(stored)) {
    memoryVoter = stored;
    return stored;
  }
  memoryVoter = `v${randomHex(12)}`;
  storageSet(VOTER_KEY, memoryVoter);
  return memoryVoter;
}

export function getSavedName() {
  return storageGet(NAME_KEY) || memoryName || '';
}

export function saveName(name) {
  memoryName = String(name ?? '');
  storageSet(NAME_KEY, memoryName);
}

/** Test hook: forget the in-memory copies. */
export function _resetIdentity() {
  memoryVoter = '';
  memoryName = '';
}

// ---------------------------------------------------------------------------
// Helpers

const ID_RE = /^[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{8}$/;

function tripId(id) {
  const code = String(id ?? '').trim().toUpperCase();
  if (!ID_RE.test(code)) throw new ApiError('trip_not_found');
  return code;
}

function nullIfEmpty(v) {
  if (v === undefined || v === null) return null;
  const s = String(v).trim();
  return s === '' ? null : s;
}

function activityPayload(a = {}) {
  return {
    title: String(a.title ?? '').trim(),
    description: nullIfEmpty(a.description),
    source_url: nullIfEmpty(a.source_url ?? a.sourceUrl),
  };
}

const TRIP_FIELD_ALIASES = {
  name: 'name', tripName: 'name',
  destination: 'destination',
  start_date: 'start_date', startDate: 'start_date',
  end_date: 'end_date', endDate: 'end_date',
  voting_deadline: 'voting_deadline', votingDeadline: 'voting_deadline',
  itinerary_size: 'itinerary_size', itinerarySize: 'itinerary_size',
};

async function closedTime(id) {
  // Best effort: when did voting close? Used only to word the error.
  try {
    const c = await getClient();
    const { data } = await c.from('trip_summary')
      .select('status,closed_at,voting_deadline').eq('trip_id', id).maybeSingle();
    if (!data) return '';
    return data.status === 'closed' && data.closed_at ? data.closed_at : data.voting_deadline;
  } catch {
    return '';
  }
}

async function withClosedWording(id, kind, fn) {
  try {
    return await fn();
  } catch (e) {
    if (e instanceof ApiError && e.code === 'voting_closed') {
      const closedAt = await closedTime(id);
      throw build('voting_closed', e.detail, { closedAt, kind });
    }
    throw e;
  }
}

// ---------------------------------------------------------------------------
// Trips

/**
 * input: the `value` from validateTripForm (snake_case, as create_trip expects).
 * camelCase names are accepted too. Returns { id }.
 */
export async function createTrip(input = {}) {
  const pick = (a, b) => (input[a] !== undefined ? input[a] : input[b]);
  const payload = {
    name: String(pick('name', 'tripName') ?? '').trim(),
    destination: String(input.destination ?? '').trim(),
    start_date: pick('start_date', 'startDate'),
    end_date: pick('end_date', 'endDate'),
    voting_deadline: pick('voting_deadline', 'votingDeadline'),
    itinerary_size: Number(pick('itinerary_size', 'itinerarySize')),
    organizer_name: String(pick('organizer_name', 'organizerName') ?? '').trim(),
    voter: getVoterId(),
    activities: (Array.isArray(input.activities) ? input.activities : []).map(activityPayload),
  };
  const id = await call((c) => c.rpc('create_trip', { p: payload }));
  saveName(payload.organizer_name);
  return { id };
}

async function fetchAll(build, pageSize = 1000) {
  const rows = [];
  for (let from = 0; ; from += pageSize) {
    const { data, error } = await build().range(from, from + pageSize - 1);
    if (error) throw error;
    rows.push(...data);
    if (data.length < pageSize) return rows;
  }
}

/** Load everything a trip screen needs. Returns null when there is no such trip. */
export async function loadTrip(id) {
  let code;
  try {
    code = tripId(id);
  } catch {
    return null;
  }
  const voter = getVoterId();
  const [summary, standing, voters, members] = await call(async (c) => {
    const [s, st, vo, me] = await Promise.all([
      c.from('trip_summary').select('*').eq('trip_id', code).maybeSingle(),
      c.from('trip_standing').select('*').eq('trip_id', code).order('rank').order('seq'),
      fetchAll(() => c.from('trip_voters').select('*').eq('trip_id', code).order('voted_at').order('display_name')).then((data) => ({ data }), (error) => ({ error })),
      c.from('trip_members').select('*').eq('trip_id', code).order('joined_at').order('display_name'),
    ]);
    for (const r of [s, st, vo, me]) if (r.error) return r;
    if (!s.data) return { data: [null] };
    return { data: [s.data, st.data, vo.data, me.data] };
  });
  if (!summary) return null;
  const mine = members.find((m) => m.voter === voter) || null;
  return {
    summary,
    standing,
    voters,
    members,
    me: {
      isMember: !!mine,
      name: mine ? mine.display_name : '',
      role: mine ? mine.role : '',
      votedActivityIds: voters.filter((v) => v.voter === voter).map((v) => v.activity_id),
    },
  };
}

export async function joinTrip(id, name) {
  const code = tripId(id);
  const check = validateField('displayName', name);
  if (!check.ok) throw new ApiError('invalid_input', check.error, 'display_name');
  await call((c) => c.rpc('join_trip', { p_trip: code, p_voter: getVoterId(), p_name: check.value }));
  saveName(check.value);
}

export async function setVote(id, activityId, on) {
  const code = tripId(id);
  await withClosedWording(code, 'vote', () =>
    call((c) => c.rpc('set_vote', { p_trip: code, p_activity: activityId, p_voter: getVoterId(), p_on: !!on }), { kind: 'vote' }));
}

export async function addActivity(id, a) {
  const code = tripId(id);
  return withClosedWording(code, 'change', () =>
    call((c) => c.rpc('add_activity', { p_trip: code, p: activityPayload(a) })));
}

export async function updateActivity(activityId, a) {
  await call((c) => c.rpc('update_activity', { p_activity: activityId, p: activityPayload(a) }));
}

export async function removeActivity(activityId) {
  const n = await call((c) => c.rpc('remove_activity', { p_activity: activityId }));
  return { votesRemoved: Number(n) || 0 };
}

export async function updateTrip(id, fields = {}) {
  const code = tripId(id);
  const p = {};
  for (const [k, v] of Object.entries(fields)) {
    const key = TRIP_FIELD_ALIASES[k];
    if (!key) continue;
    p[key] = key === 'itinerary_size' ? Number(v) : (typeof v === 'string' ? v.trim() : v);
  }
  await withClosedWording(code, 'change', () =>
    call((c) => c.rpc('update_trip', { p_trip: code, p })));
}

export async function setDefaultPick(id, activityId) {
  const code = tripId(id);
  await call((c) => c.rpc('set_default_pick', { p_trip: code, p_activity: activityId }));
}

export async function closeTrip(id) {
  const code = tripId(id);
  await call((c) => c.rpc('close_trip', { p_trip: code }));
}

export async function reopenTrip(id, deadlineIso) {
  const code = tripId(id);
  await call((c) => c.rpc('reopen_trip', { p_trip: code, p_deadline: deadlineIso || null }));
}

export async function deleteTrip(id, confirmName) {
  const code = tripId(id);
  const r = await call((c) => c.rpc('delete_trip', { p_trip: code, p_confirm_name: String(confirmName ?? '') }));
  return {
    activities: Number(r && r.activities) || 0,
    votes: Number(r && r.votes) || 0,
    members: Number(r && r.members) || 0,
  };
}

// ---------------------------------------------------------------------------
// Live updates

/**
 * Call onChange() whenever the trip changes, and when the tab regains focus.
 * Reconnects on its own with backoff and refreshes after each reconnect.
 * Returns an unsubscribe function.
 * opts: { debounceMs=100, pollMs=30000 (0 turns the safety poll off), backoffMs=[1000,2000,5000,10000,30000] }
 */
export function subscribe(id, onChange, opts = {}) {
  const code = tripId(id);
  const debounceMs = opts.debounceMs ?? 100;
  const pollMs = opts.pollMs ?? 30000;
  const backoff = opts.backoffMs ?? [1000, 2000, 5000, 10000, 30000];

  let stopped = false;
  let channel = null;
  let joined = false;
  let attempt = 0;
  let retryTimer = null;
  let debounceTimer = null;
  let pollTimer = null;
  let wasDown = false;
  let everJoined = false;
  let generation = 0;

  const fire = () => {
    if (stopped) return;
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      debounceTimer = null;
      if (!stopped) {
        try { onChange(); } catch { /* a failing listener must not break the feed */ }
      }
    }, debounceMs);
  };

  const forThisTrip = (payload) => {
    // Deletes may arrive without the trip id (only the row id is kept). Refresh rather than miss one.
    const row = (payload && (payload.new && Object.keys(payload.new).length ? payload.new : payload.old)) || {};
    if (payload && payload.table === 'trips') return row.id === undefined || row.id === code;
    return row.trip_id === undefined || row.trip_id === code;
  };

  const teardown = async () => {
    const ch = channel;
    channel = null;
    joined = false;
    if (ch) {
      try {
        const c = await getClient();
        await c.removeChannel(ch);
      } catch { /* already gone */ }
    }
  };

  const scheduleRetry = () => {
    if (stopped || retryTimer) return;
    wasDown = true;
    const delay = backoff[Math.min(attempt, backoff.length - 1)];
    attempt += 1;
    retryTimer = setTimeout(async () => {
      retryTimer = null;
      await teardown();
      connect();
    }, delay);
  };

  async function connect() {
    if (stopped) return;
    const mine = ++generation;
    let c;
    try {
      c = await getClient();
    } catch {
      scheduleRetry();
      return;
    }
    if (stopped || mine !== generation) return;
    const ch = c.channel(`trip-${code}-${randomHex(4)}`);
    const handler = (payload) => { if (forThisTrip(payload)) fire(); };
    for (const table of ['votes', 'activities', 'members']) {
      ch.on('postgres_changes', { event: 'INSERT', schema: 'public', table, filter: `trip_id=eq.${code}` }, handler);
      ch.on('postgres_changes', { event: 'UPDATE', schema: 'public', table, filter: `trip_id=eq.${code}` }, handler);
      ch.on('postgres_changes', { event: 'DELETE', schema: 'public', table }, handler);
    }
    ch.on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'trips', filter: `id=eq.${code}` }, handler);
    ch.on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'trips', filter: `id=eq.${code}` }, handler);
    ch.on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'trips' }, handler);
    channel = ch;
    ch.subscribe((status) => {
      if (stopped || ch !== channel) return;
      if (status === 'SUBSCRIBED') {
        joined = true;
        attempt = 0;
        // Changes made after the page loaded but before the feed joined are not delivered, and so are
        // changes made while the feed was down. Refresh once in either case.
        if (wasDown || !everJoined) { wasDown = false; fire(); }
        everJoined = true;
      } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
        joined = false;
        scheduleRetry();
      }
    });
  }

  const wake = () => {
    if (stopped) return;
    if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return;
    fire();
    if (!joined && !retryTimer) { // feed is down: try again now instead of waiting
      attempt = 0;
      teardown().then(connect);
    }
  };

  const hasWindow = typeof window !== 'undefined' && typeof window.addEventListener === 'function';
  const hasDoc = typeof document !== 'undefined' && typeof document.addEventListener === 'function';
  if (hasWindow) {
    window.addEventListener('focus', wake);
    window.addEventListener('online', wake);
  }
  if (hasDoc) document.addEventListener('visibilitychange', wake);
  if (pollMs > 0) {
    pollTimer = setInterval(() => {
      if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return;
      fire();
    }, pollMs);
  }

  connect();

  return function unsubscribe() {
    if (stopped) return;
    stopped = true;
    clearTimeout(retryTimer);
    clearTimeout(debounceTimer);
    clearInterval(pollTimer);
    if (hasWindow) {
      window.removeEventListener('focus', wake);
      window.removeEventListener('online', wake);
    }
    if (hasDoc) document.removeEventListener('visibilitychange', wake);
    teardown();
  };
}
