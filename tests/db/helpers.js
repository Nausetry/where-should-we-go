// Shared helpers for the database tests. Functions are called as the anon role, like the page does.
import { expect } from 'vitest';
import { freshDb, asRole } from '../db.js';

export const FUTURE = '2099-01-01T00:00:00Z';
export const PAST = '2000-01-01T00:00:00Z';

export async function setup() {
  const { db } = await freshDb();
  return { db, anon: asRole(db, 'anon'), authed: asRole(db, 'authenticated', { sub: '00000000-0000-0000-0000-000000000001', email: 'a@example.com' }) };
}

export const voterId = (n) => `voter-${String(n).padStart(4, '0')}`;
export const rep = (ch, n) => ch.repeat(n);

export function tripInput(over = {}) {
  return {
    name: 'Cape Cod, October',
    destination: 'Provincetown, MA',
    start_date: '2026-10-10',
    end_date: '2026-10-14',
    voting_deadline: FUTURE,
    itinerary_size: 3,
    organizer_name: 'Pat Jones',
    voter: voterId(0),
    activities: [
      { title: 'Whale watching cruise', description: 'Three hours, departs 9 AM', source_url: 'https://example.com/cruise' },
      { title: 'Dune tour' },
      { title: 'Lobster dinner', description: null, source_url: null },
    ],
    ...over,
  };
}

export async function createTrip(anon, over = {}) {
  const r = await anon.query('select public.create_trip($1::jsonb) as id', [JSON.stringify(tripInput(over))]);
  return r.rows[0].id;
}

export async function activitiesOf(db, id) {
  return (await db.query('select id, seq, title from public.activities where trip_id = $1 order by seq', [id])).rows;
}

export const join = (anon, trip, voter, name) =>
  anon.query('select public.join_trip($1, $2, $3)', [trip, voter, name]);
export const vote = (anon, trip, act, voter, on = true) =>
  anon.query('select public.set_vote($1, $2, $3, $4)', [trip, act, voter, on]);

export async function summary(db, id) {
  return (await db.query('select * from public.trip_summary where trip_id = $1', [id])).rows[0];
}
export async function standing(db, id) {
  return (await db.query('select * from public.trip_standing where trip_id = $1 order by rank', [id])).rows;
}

export const closeByStatus = (db, id) =>
  db.query("update public.trips set status = 'closed', closed_at = now() where id = $1", [id]);
export const closeByDeadline = (db, id) =>
  db.query("update public.trips set voting_deadline = now() - interval '1 hour' where id = $1", [id]);

// Runs a promise and expects an error whose message begins with the given code.
export async function expectCode(promise, code) {
  let err;
  try {
    await promise;
  } catch (e) {
    err = e;
  }
  expect(err, `expected error ${code}`).toBeDefined();
  expect(err.message.startsWith(code), `message was: ${err.message}`).toBe(true);
  return err;
}

// Expects a constraint violation naming the given constraint.
export async function expectConstraint(promise, name) {
  let err;
  try {
    await promise;
  } catch (e) {
    err = e;
  }
  expect(err, `expected constraint ${name}`).toBeDefined();
  expect(err.message).toContain(`"${name}"`);
}

// Builds a trip for the decision-rule tests.
// opts: { size, acts (count), defaultIdx, members: [[activity indexes voted], ...] (member 0 is the organizer) }
export async function build(ctx, opts) {
  const { db, anon } = ctx;
  const { size, acts = 5, defaultIdx = 0, members = [[]] } = opts;
  const first = Math.min(acts, 10);
  const activities = Array.from({ length: first }, (_, i) => ({ title: `Act ${String(i).padStart(2, '0')}` }));
  const id = await createTrip(anon, { itinerary_size: size, activities });
  for (let i = first; i < acts; i++) {
    await anon.query('select public.add_activity($1, $2::jsonb)', [id, JSON.stringify({ title: `Act ${String(i).padStart(2, '0')}` })]);
  }
  const rows = await activitiesOf(db, id);
  const ids = rows.map((r) => r.id);
  for (let m = 1; m < members.length; m++) await join(anon, id, voterId(m), `Member ${m}`);
  if (defaultIdx !== 0) await anon.query('select public.set_default_pick($1, $2)', [id, ids[defaultIdx]]);
  for (let m = 0; m < members.length; m++) {
    for (const a of members[m]) await vote(anon, id, ids[a], voterId(m), true);
  }
  return { id, ids };
}

// Standing as titles ("Act 03") in rank order, plus totals.
export async function view(db, id) {
  const s = await standing(db, id);
  return {
    order: s.map((r) => Number(r.title.slice(4))),
    total: s.map((r) => r.total_votes),
    cast: s.map((r) => r.cast_votes),
    dflt: s.map((r) => r.default_votes),
    inItin: s.filter((r) => r.in_itinerary).map((r) => Number(r.title.slice(4))),
    rows: s,
  };
}
