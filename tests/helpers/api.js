// Direct access to the hosted API with the publishable key only (never a secret key).
// Used to arrange test data and to read back stored values. Every trip made here is
// named with the ZZ-TEST prefix and is tracked so it can be deleted.
import { createClient } from '@supabase/supabase-js';
import { randomBytes } from 'node:crypto';
import './env.js';
import { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, TEST_PREFIX } from './env.js';

export { TEST_PREFIX };

let client;
export function sb() {
  if (!client) {
    if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) throw new Error('SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY must be set in .env');
    client = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
  }
  return client;
}

export function uid(n = 6) {
  return randomBytes(n).toString('hex').slice(0, n);
}

export function voterId() {
  return 'voter-' + randomBytes(8).toString('hex');
}

export function testName(label = 'Trip') {
  return `${TEST_PREFIX} ${label} ${uid(5)}`;
}

// ---- dates -----------------------------------------------------------------

export function isoDate(d) {
  return d.toISOString().slice(0, 10);
}
export function daysFromNow(n) {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + n);
  return isoDate(d);
}
export function addDays(iso, n) {
  const d = new Date(iso + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + n);
  return isoDate(d);
}
// "Sat, Oct 10, 2026"
export function fmtDate(iso) {
  return new Date(iso + 'T00:00:00Z').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
}
// "Oct 10, 2026"
export function fmtDateShort(iso) {
  return new Date(iso + 'T00:00:00Z').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
}
// value for an <input type="datetime-local"> in a given IANA zone, offset ms from now
export function localDateTimeValue(msFromNow, timeZone = 'America/New_York') {
  const d = new Date(Date.now() + msFromNow);
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })
      .formatToParts(d).map((p) => [p.type, p.value])
  );
  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`;
}
export function plural(n, one, many) {
  return `${n} ${n === 1 ? one : many}`;
}

// ---- trips -------------------------------------------------------------------

export const created = new Map(); // id -> name (trips this process made or was told about)

export function track(id, name) {
  if (id && name) created.set(id, name);
}

export function sampleActivities(count = 4, prefix = 'Activity') {
  return Array.from({ length: count }, (_, i) => ({
    title: `${prefix} ${String.fromCharCode(65 + i)} ${i + 1}`,
    description: `Description for ${prefix} ${String.fromCharCode(65 + i)}`,
    source_url: i === 0 ? 'https://example.com/first' : null,
  }));
}

async function rpc(fn, args) {
  const { data, error } = await sb().rpc(fn, args);
  if (error) {
    const e = new Error(`${fn} failed: ${error.message}`);
    e.code = error.message;
    throw e;
  }
  return data;
}

// Creates a trip through the hosted create_trip function.
// Options: label, activities (array of titles/objects or a count), size, deadlineMs (ms from now),
// startOffsetDays, lengthDays, organizer, voter.
export async function createTestTrip(opts = {}) {
  const name = opts.name || testName(opts.label || 'Trip');
  const start = daysFromNow(opts.startOffsetDays ?? 30);
  const end = addDays(start, (opts.lengthDays ?? 5) - 1);
  let activities = opts.activities ?? 4;
  if (typeof activities === 'number') activities = sampleActivities(activities, opts.prefix || 'Activity');
  activities = activities.map((a) => (typeof a === 'string' ? { title: a, description: null, source_url: null } : a));
  const organizerVoter = opts.voter || voterId();
  const p = {
    name,
    destination: opts.destination || 'Provincetown, MA',
    start_date: start,
    end_date: end,
    voting_deadline: new Date(Date.now() + (opts.deadlineMs ?? 3 * 24 * 3600 * 1000)).toISOString(),
    itinerary_size: opts.size ?? 3,
    organizer_name: opts.organizer || 'Olivia Organizer',
    voter: organizerVoter,
    activities,
  };
  const id = await rpc('create_trip', { p });
  track(id, name);
  const standing = await getStanding(id);
  return { id, name, start, end, organizerVoter, organizerName: p.organizer_name, activities: standing, payload: p };
}

export async function getStanding(id) {
  const { data, error } = await sb().from('trip_standing').select('*').eq('trip_id', id).order('seq', { ascending: true });
  if (error) throw new Error('trip_standing read failed: ' + error.message);
  return data;
}
export async function getSummary(id) {
  const { data, error } = await sb().from('trip_summary').select('*').eq('trip_id', id).maybeSingle();
  if (error) throw new Error('trip_summary read failed: ' + error.message);
  return data;
}
export async function tripExists(id) {
  const { data, error } = await sb().from('trips').select('id').eq('id', id).maybeSingle();
  if (error) throw new Error('trips read failed: ' + error.message);
  return !!data;
}
export async function tripsNamed(name) {
  const { data, error } = await sb().from('trips').select('id,name').eq('name', name);
  if (error) throw new Error('trips read failed: ' + error.message);
  return data;
}

export async function addMember(id, name, voter = voterId()) {
  await rpc('join_trip', { p_trip: id, p_voter: voter, p_name: name });
  return voter;
}
export async function castVote(id, activityId, voter, on = true) {
  await rpc('set_vote', { p_trip: id, p_activity: activityId, p_voter: voter, p_on: on });
}
// Adds a member with the given name who votes for each listed activity.
export async function addVoter(id, name, activityIds = []) {
  const voter = await addMember(id, name);
  for (const a of activityIds) await castVote(id, a, voter, true);
  return voter;
}
export async function closeTrip(id) {
  await rpc('close_trip', { p_trip: id });
}
export async function reopenTrip(id, deadlineIso = null) {
  await rpc('reopen_trip', { p_trip: id, p_deadline: deadlineIso });
}
export async function updateTrip(id, fields) {
  await rpc('update_trip', { p_trip: id, p: fields });
}
export async function setDefaultPick(id, activityId) {
  await rpc('set_default_pick', { p_trip: id, p_activity: activityId });
}
export async function removeActivity(activityId) {
  return rpc('remove_activity', { p_activity: activityId });
}
export async function addActivityApi(id, a) {
  return rpc('add_activity', { p_trip: id, p: a });
}

// Returns a map of activityId to total votes for a trip, read from the standing view.
export async function totals(id) {
  const rows = await getStanding(id);
  return Object.fromEntries(rows.map((r) => [r.activity_id, r.total_votes]));
}

// ---- cleanup -----------------------------------------------------------------

export async function deleteTripQuietly(id, name) {
  try {
    // Always use the stored name (the page may have normalized spaces in what was typed).
    const { data } = await sb().from('trips').select('name').eq('id', id).maybeSingle();
    name = data?.name;
    if (!name) return false;
    await rpc('delete_trip', { p_trip: id, p_confirm_name: name });
    return true;
  } catch {
    return false;
  }
}

// Deletes every trip this process tracked, then (optionally) any ZZ-TEST trip older than
// minAgeMs left behind by an earlier crashed run. minAgeMs = 0 deletes all of them.
export async function cleanupTracked() {
  let n = 0;
  for (const [id, name] of [...created.entries()]) {
    if (await deleteTripQuietly(id, name)) n++;
    created.delete(id);
  }
  return n;
}

export async function sweepStragglers(minAgeMs = 5 * 60 * 1000) {
  let n = 0;
  try {
    const { data, error } = await sb().from('trips').select('id,name,created_at').like('name', `${TEST_PREFIX}%`);
    if (error) return 0;
    const cutoff = Date.now() - minAgeMs;
    for (const t of data || []) {
      if (!t.name.startsWith(TEST_PREFIX)) continue;
      if (new Date(t.created_at).getTime() <= cutoff) {
        if (await deleteTripQuietly(t.id, t.name)) n++;
      }
    }
  } catch { /* nothing to sweep */ }
  return n;
}
