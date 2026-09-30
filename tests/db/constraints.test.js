// Every table constraint at its limits and one past, plus control characters, cascades, and uniqueness.
import { describe, test, expect, beforeAll } from 'vitest';
import { setup, rep, expectConstraint, FUTURE } from './helpers.js';

let ctx;
let n = 0;
const ALPHA = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
const newId = () => {
  n += 1;
  let x = n;
  let out = '';
  for (let i = 0; i < 8; i++) {
    out = ALPHA[x % 31] + out;
    x = Math.floor(x / 31);
  }
  return out;
};

beforeAll(async () => {
  ctx = await setup();
});

const base = (over = {}) => ({
  id: newId(),
  name: 'Cape Cod',
  destination: 'Provincetown',
  start_date: '2026-10-10',
  end_date: '2026-10-14',
  itinerary_size: 3,
  voting_deadline: FUTURE,
  ...over,
});

function insertTrip(over) {
  const t = base(over);
  const keys = Object.keys(t);
  return ctx.db.query(
    `insert into public.trips (${keys.join(',')}) values (${keys.map((_, i) => `$${i + 1}`).join(',')})`,
    keys.map((k) => t[k]),
  ).then(() => t.id);
}

async function tripWithMember() {
  const id = await insertTrip();
  await ctx.db.query("insert into public.members (trip_id, voter, display_name) values ($1, 'voter-0001', 'Pat')", [id]);
  const a = await ctx.db.query("insert into public.activities (trip_id, title) values ($1, 'Whale watching') returning id", [id]);
  return { id, act: a.rows[0].id };
}

describe('trips', () => {
  test.each([
    ['name at 3', 'name', rep('a', 3), true],
    ['name at 2', 'name', rep('a', 2), false, 'trips_name_rule'],
    ['name at 60', 'name', rep('a', 60), true],
    ['name at 61', 'name', rep('a', 61), false, 'trips_name_rule'],
    ['name untrimmed', 'name', ' abc', false, 'trips_name_rule'],
    ['name trailing space', 'name', 'abc ', false, 'trips_name_rule'],
    ['name with newline', 'name', 'ab\ncd', false, 'trips_name_rule'],
    ['name with tab', 'name', 'ab\tcd', false, 'trips_name_rule'],
    ['name with bell', 'name', 'ab\x07cd', false, 'trips_name_rule'],
    ['name with delete char', 'name', 'ab\x7fcd', false, 'trips_name_rule'],
    ['destination at 2', 'destination', rep('a', 2), true],
    ['destination at 1', 'destination', 'a', false, 'trips_destination_rule'],
    ['destination at 60', 'destination', rep('a', 60), true],
    ['destination at 61', 'destination', rep('a', 61), false, 'trips_destination_rule'],
    ['destination control', 'destination', 'Pr\x01ovince', false, 'trips_destination_rule'],
    ['destination untrimmed', 'destination', ' Provincetown', false, 'trips_destination_rule'],
    ['size 1', 'itinerary_size', 1, true],
    ['size 0', 'itinerary_size', 0, false, 'trips_itinerary_size_rule'],
    ['size 30', 'itinerary_size', 30, true],
    ['size 31', 'itinerary_size', 31, false, 'trips_itinerary_size_rule'],
    ['size negative', 'itinerary_size', -1, false, 'trips_itinerary_size_rule'],
    ['status open', 'status', 'open', true],
    ['status closed', 'status', 'closed', true],
    ['status other', 'status', 'archived', false, 'trips_status_rule'],
    ['id with look-alike letter O', 'id', 'ABCDEFGO', false, 'trips_id_format'],
    ['id with digit 0', 'id', 'ABCDEFG0', false, 'trips_id_format'],
    ['id with digit 1', 'id', 'ABCDEFG1', false, 'trips_id_format'],
    ['id with letter I', 'id', 'ABCDEFGI', false, 'trips_id_format'],
    ['id with letter L', 'id', 'ABCDEFGL', false, 'trips_id_format'],
    ['id lowercase', 'id', 'abcdefgh', false, 'trips_id_format'],
    ['id 7 long', 'id', 'ABCDEFG', false, 'trips_id_format'],
    ['id 9 long', 'id', 'ABCDEFGHJ', false, 'trips_id_format'],
    ['id valid alphabet edge', 'id', 'Z2345679', true],
  ])('%s', async (_label, col, value, ok, constraint) => {
    const p = insertTrip({ [col]: value });
    if (ok) await p;
    else await expectConstraint(p, constraint);
  });

  test('end date equal to start date is allowed, before is rejected', async () => {
    await insertTrip({ start_date: '2026-10-10', end_date: '2026-10-10' });
    await expectConstraint(insertTrip({ start_date: '2026-10-10', end_date: '2026-10-09' }), 'trips_dates_order');
  });

  test('required columns reject null', async () => {
    for (const col of ['name', 'destination', 'start_date', 'end_date', 'itinerary_size', 'voting_deadline']) {
      await expect(insertTrip({ [col]: null })).rejects.toThrow(/null value/);
    }
  });

  test('closed_at only allowed on a closed trip', async () => {
    await expectConstraint(insertTrip({ status: 'open', closed_at: '2026-10-01T00:00:00Z' }), 'trips_closed_at_rule');
    await insertTrip({ status: 'closed', closed_at: '2026-10-01T00:00:00Z' });
  });

  test('status defaults to open and created_at is set', async () => {
    const id = await insertTrip();
    const r = await ctx.db.query('select status, created_at, closed_at, default_activity_id from public.trips where id = $1', [id]);
    expect(r.rows[0].status).toBe('open');
    expect(r.rows[0].created_at).toBeInstanceOf(Date);
    expect(r.rows[0].closed_at).toBeNull();
    expect(r.rows[0].default_activity_id).toBeNull();
  });

  test('duplicate id is rejected', async () => {
    const id = await insertTrip();
    await expect(insertTrip({ id })).rejects.toThrow(/duplicate key/);
  });
});

describe('activities', () => {
  const ins = async (over) => {
    const id = await insertTrip();
    const a = { trip_id: id, title: 'Whale watching', ...over };
    const keys = Object.keys(a);
    return ctx.db.query(
      `insert into public.activities (${keys.join(',')}) values (${keys.map((_, i) => `$${i + 1}`).join(',')})`,
      keys.map((k) => a[k]),
    );
  };
  test.each([
    ['title at 3', { title: rep('a', 3) }, true],
    ['title at 2', { title: rep('a', 2) }, false, 'activities_title_rule'],
    ['title at 80', { title: rep('a', 80) }, true],
    ['title at 81', { title: rep('a', 81) }, false, 'activities_title_rule'],
    ['title untrimmed', { title: ' abc' }, false, 'activities_title_rule'],
    ['title control', { title: 'ab\x00c'.replace('\x00', '\x1f') }, false, 'activities_title_rule'],
    ['title newline', { title: 'ab\ncd' }, false, 'activities_title_rule'],
    ['description null', { description: null }, true],
    ['description at 1', { description: 'a' }, true],
    ['description empty', { description: '' }, false, 'activities_description_rule'],
    ['description at 140', { description: rep('a', 140) }, true],
    ['description at 141', { description: rep('a', 141) }, false, 'activities_description_rule'],
    ['description untrimmed', { description: 'abc ' }, false, 'activities_description_rule'],
    ['description control', { description: 'a\tb' }, false, 'activities_description_rule'],
    ['url null', { source_url: null }, true],
    ['url https', { source_url: 'https://example.com/cruise' }, true],
    ['url http', { source_url: 'http://example.com' }, true],
    ['url minimal', { source_url: 'http://x' }, true],
    ['url ftp', { source_url: 'ftp://example.com' }, false, 'activities_source_url_rule'],
    ['url no scheme', { source_url: 'example.com' }, false, 'activities_source_url_rule'],
    ['url scheme only', { source_url: 'https://' }, false, 'activities_source_url_rule'],
    ['url with space', { source_url: 'https://exa mple.com' }, false, 'activities_source_url_rule'],
    ['url with newline', { source_url: 'https://example.com\n' }, false, 'activities_source_url_rule'],
    ['url with control', { source_url: 'https://example.com/\x01' }, false, 'activities_source_url_rule'],
    ['url at 500', { source_url: 'https://e.co/' + rep('a', 500 - 13) }, true],
    ['url at 501', { source_url: 'https://e.co/' + rep('a', 501 - 13) }, false, 'activities_source_url_rule'],
  ])('%s', async (_label, over, ok, constraint) => {
    const p = ins(over);
    if (ok) await p;
    else await expectConstraint(p, constraint);
  });

  test('seq increases in insertion order and cannot be set', async () => {
    const id = await insertTrip();
    for (const t of ['First one', 'Second one', 'Third one']) {
      await ctx.db.query('insert into public.activities (trip_id, title) values ($1, $2)', [id, t]);
    }
    const r = await ctx.db.query('select title, seq from public.activities where trip_id = $1 order by seq', [id]);
    expect(r.rows.map((x) => x.title)).toEqual(['First one', 'Second one', 'Third one']);
    expect(r.rows[0].seq < r.rows[1].seq && r.rows[1].seq < r.rows[2].seq).toBe(true);
    await expect(
      ctx.db.query('insert into public.activities (trip_id, title, seq) values ($1, $2, 99)', [id, 'Explicit seq']),
    ).rejects.toThrow(/non-DEFAULT/);
  });

  test('activity needs an existing trip', async () => {
    await expect(ctx.db.query("insert into public.activities (trip_id, title) values ('ZZZZZZZZ', 'Orphan one')")).rejects.toThrow(/foreign key/);
  });
});

describe('members', () => {
  const ins = async (over) => {
    const id = await insertTrip();
    const m = { trip_id: id, voter: 'voter-0001', display_name: 'Pat', ...over };
    const keys = Object.keys(m);
    return ctx.db.query(
      `insert into public.members (${keys.join(',')}) values (${keys.map((_, i) => `$${i + 1}`).join(',')})`,
      keys.map((k) => m[k]),
    );
  };
  test.each([
    ['voter at 8', { voter: rep('v', 8) }, true],
    ['voter at 7', { voter: rep('v', 7) }, false, 'members_voter_rule'],
    ['voter at 64', { voter: rep('v', 64) }, true],
    ['voter at 65', { voter: rep('v', 65) }, false, 'members_voter_rule'],
    ['voter untrimmed', { voter: ' voter-0001' }, false, 'members_voter_rule'],
    ['voter control', { voter: 'voter-\x01001' }, false, 'members_voter_rule'],
    ['name at 2', { display_name: 'Jo' }, true],
    ['name at 1', { display_name: 'J' }, false, 'members_display_name_rule'],
    ['name at 40', { display_name: rep('a', 40) }, true],
    ['name at 41', { display_name: rep('a', 41) }, false, 'members_display_name_rule'],
    ['name control', { display_name: 'Jo\nhn' }, false, 'members_display_name_rule'],
    ['name untrimmed', { display_name: 'Jo ' }, false, 'members_display_name_rule'],
    ['role organizer', { role: 'organizer' }, true],
    ['role member', { role: 'member' }, true],
    ['role other', { role: 'admin' }, false, 'members_role_rule'],
    ['email lowercase', { email: 'pat@example.com' }, true],
    ['email uppercase', { email: 'Pat@Example.com' }, false, 'members_email_rule'],
    ['email with space', { email: ' pat@example.com' }, false, 'members_email_rule'],
  ])('%s', async (_label, over, ok, constraint) => {
    const p = ins(over);
    if (ok) await p;
    else await expectConstraint(p, constraint);
  });

  test('role defaults to member and email to null', async () => {
    const { id } = await tripWithMember();
    const r = await ctx.db.query('select role, email from public.members where trip_id = $1', [id]);
    expect(r.rows[0]).toEqual({ role: 'member', email: null });
  });

  test('same voter twice in one trip is rejected, same voter in two trips is fine', async () => {
    const { id } = await tripWithMember();
    await expect(ctx.db.query("insert into public.members (trip_id, voter, display_name) values ($1, 'voter-0001', 'Pat')", [id])).rejects.toThrow(/duplicate key/);
    const other = await insertTrip();
    await ctx.db.query("insert into public.members (trip_id, voter, display_name) values ($1, 'voter-0001', 'Pat')", [other]);
  });
});

describe('votes', () => {
  test('one vote per person per activity', async () => {
    const { id, act } = await tripWithMember();
    await ctx.db.query("insert into public.votes (trip_id, activity_id, voter) values ($1, $2, 'voter-0001')", [id, act]);
    await expectConstraint(
      ctx.db.query("insert into public.votes (trip_id, activity_id, voter) values ($1, $2, 'voter-0001')", [id, act]),
      'votes_one_per_person',
    );
  });

  test('two people can vote for the same activity', async () => {
    const { id, act } = await tripWithMember();
    await ctx.db.query("insert into public.members (trip_id, voter, display_name) values ($1, 'voter-0002', 'Sam')", [id]);
    await ctx.db.query("insert into public.votes (trip_id, activity_id, voter) values ($1, $2, 'voter-0001'), ($1, $2, 'voter-0002')", [id, act]);
    const r = await ctx.db.query('select count(*)::int as n from public.votes where activity_id = $1', [act]);
    expect(r.rows[0].n).toBe(2);
  });

  test('vote must name an activity of the same trip', async () => {
    const a = await tripWithMember();
    const b = await tripWithMember();
    await expectConstraint(
      ctx.db.query("insert into public.votes (trip_id, activity_id, voter) values ($1, $2, 'voter-0001')", [a.id, b.act]),
      'votes_activity_fk',
    );
  });

  test('vote must come from a member of the trip', async () => {
    const { id, act } = await tripWithMember();
    await expectConstraint(
      ctx.db.query("insert into public.votes (trip_id, activity_id, voter) values ($1, $2, 'voter-9999')", [id, act]),
      'votes_member_fk',
    );
  });
});

describe('invites', () => {
  test('email stored lowercase, unique per trip, role checked', async () => {
    const id = await insertTrip();
    await ctx.db.query("insert into public.invites (trip_id, email) values ($1, 'pat@example.com')", [id]);
    await expect(ctx.db.query("insert into public.invites (trip_id, email) values ($1, 'pat@example.com')", [id])).rejects.toThrow(/duplicate key/);
    await expectConstraint(ctx.db.query("insert into public.invites (trip_id, email) values ($1, 'Pat@example.com')", [id]), 'invites_email_rule');
    await expectConstraint(ctx.db.query("insert into public.invites (trip_id, email, role) values ($1, 'x@example.com', 'boss')", [id]), 'invites_role_rule');
  });
});

describe('default activity foreign key', () => {
  test('default pick must belong to the same trip', async () => {
    const a = await tripWithMember();
    const b = await tripWithMember();
    await expectConstraint(ctx.db.query('update public.trips set default_activity_id = $2 where id = $1', [a.id, b.act]), 'trips_default_activity_fk');
    await ctx.db.query('update public.trips set default_activity_id = $2 where id = $1', [a.id, a.act]);
  });

  test('removing the default activity nulls the pick and keeps the trip', async () => {
    const a = await tripWithMember();
    await ctx.db.query('update public.trips set default_activity_id = $2 where id = $1', [a.id, a.act]);
    await ctx.db.query('delete from public.activities where id = $1', [a.act]);
    const r = await ctx.db.query('select id, default_activity_id from public.trips where id = $1', [a.id]);
    expect(r.rows).toHaveLength(1);
    expect(r.rows[0].default_activity_id).toBeNull();
  });
});

describe('cascade deletes', () => {
  test('deleting a trip removes activities, members, votes, and invites', async () => {
    const { id, act } = await tripWithMember();
    await ctx.db.query("insert into public.votes (trip_id, activity_id, voter) values ($1, $2, 'voter-0001')", [id, act]);
    await ctx.db.query("insert into public.invites (trip_id, email) values ($1, 'pat@example.com')", [id]);
    await ctx.db.query('update public.trips set default_activity_id = $2 where id = $1', [id, act]);
    await ctx.db.query('delete from public.trips where id = $1', [id]);
    for (const t of ['activities', 'members', 'votes', 'invites']) {
      const r = await ctx.db.query(`select count(*)::int as n from public.${t} where trip_id = $1`, [id]);
      expect(r.rows[0].n, t).toBe(0);
    }
  });

  test('deleting a closed trip is allowed (closed-trip triggers do not block the cascade)', async () => {
    const { id, act } = await tripWithMember();
    await ctx.db.query("insert into public.votes (trip_id, activity_id, voter) values ($1, $2, 'voter-0001')", [id, act]);
    await ctx.db.query("update public.trips set status = 'closed' where id = $1", [id]);
    await ctx.db.query('delete from public.trips where id = $1', [id]);
    const r = await ctx.db.query('select count(*)::int as n from public.votes where trip_id = $1', [id]);
    expect(r.rows[0].n).toBe(0);
  });

  test('deleting an activity removes its votes only', async () => {
    const { id, act } = await tripWithMember();
    const other = await ctx.db.query("insert into public.activities (trip_id, title) values ($1, 'Second thing') returning id", [id]);
    await ctx.db.query("insert into public.votes (trip_id, activity_id, voter) values ($1, $2, 'voter-0001'), ($1, $3, 'voter-0001')", [id, act, other.rows[0].id]);
    await ctx.db.query('delete from public.activities where id = $1', [act]);
    const r = await ctx.db.query('select activity_id from public.votes where trip_id = $1', [id]);
    expect(r.rows.map((x) => x.activity_id)).toEqual([other.rows[0].id]);
  });

  test('removing a member removes their votes', async () => {
    const { id, act } = await tripWithMember();
    await ctx.db.query("insert into public.votes (trip_id, activity_id, voter) values ($1, $2, 'voter-0001')", [id, act]);
    await ctx.db.query("delete from public.members where trip_id = $1 and voter = 'voter-0001'", [id]);
    const r = await ctx.db.query('select count(*)::int as n from public.votes where trip_id = $1', [id]);
    expect(r.rows[0].n).toBe(0);
  });
});
