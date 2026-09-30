// Functions, error codes, closed-trip triggers, grants, and realtime settings.
import { describe, test, expect, beforeAll } from 'vitest';
import {
  setup, rep, tripInput, createTrip, activitiesOf, join, vote, summary, standing, voterId,
  closeByStatus, closeByDeadline, expectCode, FUTURE, PAST,
} from './helpers.js';

let ctx;
let db;
let anon;
beforeAll(async () => {
  ctx = await setup();
  db = ctx.db;
  anon = ctx.anon;
});

const create = (over) => anon.query('select public.create_trip($1::jsonb) as id', [JSON.stringify(tripInput(over))]);
const countTrips = async () => (await db.query('select count(*)::int as n from public.trips')).rows[0].n;
const call = (sql, params) => anon.query(sql, params);

describe('create_trip input limits', () => {
  const act = (n) => ({ title: `Activity ${n}` });
  test.each([
    ['name at 3', { name: rep('a', 3) }, true],
    ['name at 2', { name: rep('a', 2) }, 'name'],
    ['name at 60', { name: rep('a', 60) }, true],
    ['name at 61', { name: rep('a', 61) }, 'name'],
    ['name blank', { name: '   ' }, 'name'],
    ['name missing', { name: undefined }, 'name'],
    ['name null', { name: null }, 'name'],
    ['name a number', { name: 12345 }, 'name'],
    ['name with padding is trimmed to fit', { name: '  ab  c  ' }, true],
    ['name trimmed below 3', { name: '  ab  ' }, 'name'],
    ['name with tab', { name: 'Cape\tCod' }, 'name'],
    ['name with newline', { name: 'Cape\nCod' }, 'name'],
    ['name with bell', { name: 'Cape\x07Cod' }, 'name'],
    ['destination at 2', { destination: 'MA' }, true],
    ['destination at 1', { destination: 'M' }, 'destination'],
    ['destination at 60', { destination: rep('d', 60) }, true],
    ['destination at 61', { destination: rep('d', 61) }, 'destination'],
    ['destination control', { destination: 'Pro\x01vincetown' }, 'destination'],
    ['start date missing', { start_date: undefined }, 'start_date'],
    ['start date malformed', { start_date: '10/10/2026' }, 'start_date'],
    ['start date impossible', { start_date: '2026-02-30' }, 'start_date'],
    ['start date word', { start_date: 'today' }, 'start_date'],
    ['end date before start', { start_date: '2026-10-10', end_date: '2026-10-09' }, 'end_date'],
    ['end date equals start', { start_date: '2026-10-10', end_date: '2026-10-10' }, true],
    ['trip over 30 days still saves', { start_date: '2026-10-01', end_date: '2026-12-31' }, true],
    ['deadline malformed', { voting_deadline: 'soon' }, 'voting_deadline'],
    ['deadline keyword', { voting_deadline: 'infinity' }, 'voting_deadline'],
    ['deadline missing', { voting_deadline: undefined }, 'voting_deadline'],
    ['size 1', { itinerary_size: 1 }, true],
    ['size 0', { itinerary_size: 0 }, 'itinerary_size'],
    ['size 30', { itinerary_size: 30 }, true],
    ['size 31', { itinerary_size: 31 }, 'itinerary_size'],
    ['size fractional', { itinerary_size: 2.5 }, 'itinerary_size'],
    ['size text digits', { itinerary_size: '6' }, true],
    ['size text words', { itinerary_size: 'six' }, 'itinerary_size'],
    ['size missing', { itinerary_size: undefined }, 'itinerary_size'],
    ['size negative', { itinerary_size: -3 }, 'itinerary_size'],
    ['organizer name at 2', { organizer_name: 'Jo' }, true],
    ['organizer name at 1', { organizer_name: 'J' }, 'organizer_name'],
    ['organizer name at 40', { organizer_name: rep('o', 40) }, true],
    ['organizer name at 41', { organizer_name: rep('o', 41) }, 'organizer_name'],
    ['voter at 8', { voter: rep('v', 8) }, true],
    ['voter at 7', { voter: rep('v', 7) }, 'voter'],
    ['voter at 64', { voter: rep('v', 64) }, true],
    ['voter at 65', { voter: rep('v', 65) }, 'voter'],
    ['voter missing', { voter: undefined }, 'voter'],
    ['voter padded', { voter: ' voter-0009 ' }, 'voter'],
    ['2 activities', { activities: [act(1), act(2)] }, 'activities'],
    ['3 activities', { activities: [act(1), act(2), act(3)] }, true],
    ['10 activities', { activities: Array.from({ length: 10 }, (_, i) => act(i)) }, true],
    ['11 activities', { activities: Array.from({ length: 11 }, (_, i) => act(i)) }, 'activities'],
    ['activities not a list', { activities: 'many' }, 'activities'],
    ['activities missing', { activities: undefined }, 'activities'],
    ['activity title at 3', { activities: [{ title: 'abc' }, act(2), act(3)] }, true],
    ['activity title at 2', { activities: [{ title: 'ab' }, act(2), act(3)] }, 'activities[0].title'],
    ['activity title at 80', { activities: [act(1), { title: rep('t', 80) }, act(3)] }, true],
    ['activity title at 81', { activities: [act(1), { title: rep('t', 81) }, act(3)] }, 'activities[1].title'],
    ['activity title control', { activities: [act(1), act(2), { title: 'Bad\x01title' }] }, 'activities[2].title'],
    ['activity title missing', { activities: [act(1), act(2), {}] }, 'activities[2].title'],
    ['activity not an object', { activities: [act(1), 'text', act(3)] }, 'activities[1]'],
    ['activity description at 140', { activities: [{ title: 'Good one', description: rep('d', 140) }, act(2), act(3)] }, true],
    ['activity description at 141', { activities: [{ title: 'Good one', description: rep('d', 141) }, act(2), act(3)] }, 'activities[0].description'],
    ['activity description blank becomes none', { activities: [{ title: 'Good one', description: '  ' }, act(2), act(3)] }, true],
    ['activity description control', { activities: [{ title: 'Good one', description: 'a\nb' }, act(2), act(3)] }, 'activities[0].description'],
    ['activity url ok', { activities: [{ title: 'Good one', source_url: 'https://example.com/a?b=c' }, act(2), act(3)] }, true],
    ['activity url ftp', { activities: [{ title: 'Good one', source_url: 'ftp://example.com' }, act(2), act(3)] }, 'activities[0].source_url'],
    ['activity url no scheme', { activities: [{ title: 'Good one', source_url: 'example.com' }, act(2), act(3)] }, 'activities[0].source_url'],
    ['activity url with space', { activities: [{ title: 'Good one', source_url: 'https://a b.com' }, act(2), act(3)] }, 'activities[0].source_url'],
    ['activity url over 500', { activities: [{ title: 'Good one', source_url: 'https://e.co/' + rep('a', 489) }, act(2), act(3)] }, 'activities[0].source_url'],
    ['activity url at 500', { activities: [{ title: 'Good one', source_url: 'https://e.co/' + rep('a', 487) }, act(2), act(3)] }, true],
  ])('%s', async (_label, over, expected) => {
    const before = await countTrips();
    if (expected === true) {
      const r = await create(over);
      expect(r.rows[0].id).toMatch(/^[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{8}$/);
      expect(await countTrips()).toBe(before + 1);
    } else {
      const err = await expectCode(create(over), 'invalid_input');
      expect(err.message).toBe(`invalid_input: ${expected}`);
      expect(await countTrips()).toBe(before);
    }
  });

  test('payload that is not an object is rejected', async () => {
    await expectCode(call("select public.create_trip('[]'::jsonb)"), 'invalid_input');
    await expectCode(call("select public.create_trip('null'::jsonb)"), 'invalid_input');
    await expectCode(call('select public.create_trip(null)'), 'invalid_input');
  });

  test('names and text are trimmed and spaces collapse', async () => {
    const id = (await create({ name: '  Cape   Cod  ', destination: ' Province   town ', organizer_name: ' Pat   J ', activities: [{ title: ' Whale   tour ', description: ' a   b ' }, { title: 'Two two' }, { title: 'Three' }] })).rows[0].id;
    const t = (await db.query('select name, destination from public.trips where id = $1', [id])).rows[0];
    expect(t).toEqual({ name: 'Cape Cod', destination: 'Province town' });
    const a = (await db.query('select title, description from public.activities where trip_id = $1 order by seq limit 1', [id])).rows[0];
    expect(a).toEqual({ title: 'Whale tour', description: 'a b' });
    const m = (await db.query('select display_name from public.members where trip_id = $1', [id])).rows[0];
    expect(m.display_name).toBe('Pat J');
  });

  test('length is counted after trimming and collapsing', async () => {
    await create({ name: 'a' + rep(' ', 10) + 'b' + rep('c', 57) }); // 60 after collapse
    await expectCode(create({ name: rep('a', 61) + '   ' }), 'invalid_input');
  });

  test('multibyte characters count once each', async () => {
    await create({ name: rep('é', 60) });
    await expectCode(create({ name: rep('é', 61) }), 'invalid_input');
  });
});

describe('create_trip behavior', () => {
  test('deadline in the past is deadline_passed', async () => {
    const before = await countTrips();
    await expectCode(create({ voting_deadline: PAST }), 'deadline_passed');
    expect(await countTrips()).toBe(before);
  });

  test('deadline a moment ago counts as passed', async () => {
    await expectCode(create({ voting_deadline: new Date(Date.now() - 1000).toISOString() }), 'deadline_passed');
  });

  test('invalid input is reported before a passed deadline', async () => {
    await expectCode(create({ voting_deadline: PAST, name: 'ab' }), 'invalid_input');
  });

  test('stores everything, sets organizer, default pick, open status', async () => {
    const id = await createTrip(anon);
    const t = (await db.query('select * from public.trips where id = $1', [id])).rows[0];
    expect(t.name).toBe('Cape Cod, October');
    expect(t.destination).toBe('Provincetown, MA');
    expect(t.itinerary_size).toBe(3);
    expect(t.status).toBe('open');
    expect(t.closed_at).toBeNull();
    const acts = await activitiesOf(db, id);
    expect(acts.map((a) => a.title)).toEqual(['Whale watching cruise', 'Dune tour', 'Lobster dinner']);
    expect(t.default_activity_id).toBe(acts[0].id);
    const m = (await db.query('select * from public.members where trip_id = $1', [id])).rows;
    expect(m).toHaveLength(1);
    expect(m[0]).toMatchObject({ voter: voterId(0), display_name: 'Pat Jones', role: 'organizer', email: null });
    const a0 = (await db.query('select description, source_url from public.activities where id = $1', [acts[0].id])).rows[0];
    expect(a0).toEqual({ description: 'Three hours, departs 9 AM', source_url: 'https://example.com/cruise' });
  });

  test('ids are unique across many trips', async () => {
    const ids = new Set();
    for (let i = 0; i < 25; i++) ids.add(await createTrip(anon));
    expect(ids.size).toBe(25);
  });

  test('ids use the whole alphabet and never the look-alike characters', async () => {
    const seen = await db.query("select string_agg(public._new_trip_id(), '') as s from generate_series(1, 300)");
    const chars = new Set(seen.rows[0].s.split(''));
    for (const bad of ['0', '1', 'I', 'L', 'O']) expect(chars.has(bad)).toBe(false);
    expect(chars.size).toBeGreaterThan(25);
  });

  test('itinerary size may exceed the activity count', async () => {
    const id = await createTrip(anon, { itinerary_size: 30 });
    expect((await summary(db, id)).itinerary_size).toBe(30);
  });

  test('rolls back completely when a later step fails', async () => {
    const before = await countTrips();
    const acts = (await db.query('select count(*)::int as n from public.activities')).rows[0].n;
    await db.exec(`
      create function public.zz_boom() returns trigger language plpgsql as $$ begin raise exception 'boom'; end $$;
      create trigger zz_boom before insert on public.members for each row execute function public.zz_boom();
    `);
    try {
      await expect(create({})).rejects.toThrow(/boom/);
    } finally {
      await db.exec('drop trigger zz_boom on public.members; drop function public.zz_boom();');
    }
    expect(await countTrips()).toBe(before);
    expect((await db.query('select count(*)::int as n from public.activities')).rows[0].n).toBe(acts);
  });

  test('a bad activity anywhere in the list creates nothing', async () => {
    const before = await countTrips();
    const acts = (await db.query('select count(*)::int as n from public.activities')).rows[0].n;
    await expectCode(create({ name: 'ZZ rollback', activities: [{ title: 'Good one' }, { title: 'Good two' }, { title: 'x' }] }), 'invalid_input');
    expect(await countTrips()).toBe(before);
    expect((await db.query('select count(*)::int as n from public.activities')).rows[0].n).toBe(acts);
    expect((await db.query("select count(*)::int as n from public.trips where name = 'ZZ rollback'")).rows[0].n).toBe(0);
  });

  test('same voter may organize several trips', async () => {
    await createTrip(anon);
    await createTrip(anon);
  });
});

describe('join_trip', () => {
  test('adds a member and updates the name on a second call, keeping role', async () => {
    const id = await createTrip(anon);
    await join(anon, id, voterId(1), 'Sam');
    await join(anon, id, voterId(1), 'Samantha');
    const m = (await db.query('select display_name, role from public.members where trip_id = $1 and voter = $2', [id, voterId(1)])).rows;
    expect(m).toEqual([{ display_name: 'Samantha', role: 'member' }]);
    await join(anon, id, voterId(0), 'Patricia');
    const o = (await db.query('select display_name, role from public.members where trip_id = $1 and voter = $2', [id, voterId(0)])).rows[0];
    expect(o).toEqual({ display_name: 'Patricia', role: 'organizer' });
  });

  test.each([
    ['name at 2', 'Jo', true],
    ['name at 1', 'J', false],
    ['name at 40', rep('n', 40), true],
    ['name at 41', rep('n', 41), false],
    ['name blank', '  ', false],
    ['name null', null, false],
    ['name control', 'Jo\x01e', false],
  ])('%s', async (_l, name, ok) => {
    const id = await createTrip(anon);
    const p = join(anon, id, voterId(2), name);
    if (ok) await p;
    else await expectCode(p, 'invalid_input');
  });

  test('voter rules', async () => {
    const id = await createTrip(anon);
    await expectCode(join(anon, id, 'short', 'Sam'), 'invalid_input');
    await expectCode(join(anon, id, rep('v', 65), 'Sam'), 'invalid_input');
    await expectCode(join(anon, id, null, 'Sam'), 'invalid_input');
    await join(anon, id, rep('v', 64), 'Sam');
  });

  test('unknown trip is trip_not_found', async () => {
    await expectCode(join(anon, 'NOSUCHID', voterId(1), 'Sam'), 'trip_not_found');
  });

  test('a new person cannot join a closed trip (F-02, ADV-01)', async () => {
    const id = await createTrip(anon);
    await join(anon, id, voterId(1), 'Sam');
    await closeByStatus(db, id);
    const before = await summary(db, id);
    await expectCode(join(anon, id, voterId(3), 'Late Joiner'), 'voting_closed');
    const after = await summary(db, id);
    expect(after.member_count).toBe(before.member_count);
    expect(after.default_votes_total).toBe(before.default_votes_total);
    const id2 = await createTrip(anon);
    await closeByDeadline(db, id2);
    await expectCode(join(anon, id2, voterId(3), 'Late Joiner'), 'voting_closed');
    expect((await summary(db, id2)).member_count).toBe(1);
  });

  test('an existing member may still change their name after close', async () => {
    const id = await createTrip(anon);
    await join(anon, id, voterId(1), 'Sam');
    await closeByStatus(db, id);
    await join(anon, id, voterId(1), 'Samantha');
    const m = (await db.query('select display_name from public.members where trip_id = $1 and voter = $2', [id, voterId(1)])).rows;
    expect(m).toEqual([{ display_name: 'Samantha' }]);
    expect((await summary(db, id)).member_count).toBe(2);
  });

  test('reopening lets a new person join again', async () => {
    const id = await createTrip(anon);
    await closeByStatus(db, id);
    await anon.query('select public.reopen_trip($1, null)', [id]);
    await join(anon, id, voterId(4), 'Back Again');
  });
});

describe('invisible characters (ADV-03)', () => {
  const BAD = ['\u200B', '\u200D', '\u202E', '\u2066', '\uFEFF', '\u2060', '\u00AD', '\u3164'];
  test.each(BAD)('member name with %j is refused', async (ch) => {
    const id = await createTrip(anon);
    await expectCode(join(anon, id, voterId(5), `Jo${ch}e`), 'invalid_input');
    await expectCode(join(anon, id, voterId(5), `${ch}${ch}${ch}`), 'invalid_input');
  });
  test('trip name, destination, title, description and link refuse invisible characters', async () => {
    await expectCode(createTrip(anon, { name: '\u200B\u200B\u200B' }), 'invalid_input');
    await expectCode(createTrip(anon, { destination: 'Pro\u202Evince' }), 'invalid_input');
    await expectCode(createTrip(anon, { organizer_name: 'Pa\u200Bt' }), 'invalid_input');
    await expectCode(createTrip(anon, { voter: 'voter-\u200B001' }), 'invalid_input');
    const acts = (over) => [{ title: 'Dune tour', ...over }, { title: 'Lobster dinner' }, { title: 'Whale cruise' }];
    await expectCode(createTrip(anon, { activities: acts({ title: 'ZZ \u202Erevdrop\u202C x' }) }), 'invalid_input');
    await expectCode(createTrip(anon, { activities: acts({ description: '\u200B\u200B' }) }), 'invalid_input');
    await expectCode(createTrip(anon, { activities: acts({ source_url: 'http://\u200B' }) }), 'invalid_input');
    const id = await createTrip(anon);
    await expectCode(anon.query('select public.add_activity($1, $2::jsonb)', [id, JSON.stringify({ title: 'a\u200B\u200B\u200B' })]), 'invalid_input');
  });
  test('the table rules refuse them even when the functions are bypassed', async () => {
    const id = await createTrip(anon);
    await expect(db.query("update public.trips set name = 'ab' || chr(8203) || 'c' where id = $1", [id])).rejects.toThrow(/invisible|check/);
    await expect(db.query("update public.members set display_name = chr(8238) || 'Pat' where trip_id = $1", [id])).rejects.toThrow(/invisible|check/);
  });
});

describe('set_vote', () => {
  async function trip() {
    const id = await createTrip(anon);
    const acts = await activitiesOf(db, id);
    return { id, acts };
  }

  test('votes and withdraws, idempotently', async () => {
    const { id, acts } = await trip();
    await vote(anon, id, acts[1].id, voterId(0), true);
    await vote(anon, id, acts[1].id, voterId(0), true);
    let s = await standing(db, id);
    expect(s.find((r) => r.activity_id === acts[1].id).cast_votes).toBe(1);
    await vote(anon, id, acts[1].id, voterId(0), false);
    await vote(anon, id, acts[1].id, voterId(0), false);
    s = await standing(db, id);
    expect(s.find((r) => r.activity_id === acts[1].id).cast_votes).toBe(0);
  });

  test('withdrawing a vote never cast is fine', async () => {
    const { id, acts } = await trip();
    await vote(anon, id, acts[2].id, voterId(0), false);
  });

  test('not_a_member', async () => {
    const { id, acts } = await trip();
    await expectCode(vote(anon, id, acts[0].id, voterId(7), true), 'not_a_member');
    await expectCode(vote(anon, id, acts[0].id, null, true), 'not_a_member');
  });

  test('activity_not_found, including an activity from another trip', async () => {
    const a = await trip();
    const b = await trip();
    await expectCode(vote(anon, a.id, '00000000-0000-0000-0000-000000000000', voterId(0), true), 'activity_not_found');
    await expectCode(vote(anon, a.id, b.acts[0].id, voterId(0), true), 'activity_not_found');
    await expectCode(vote(anon, a.id, null, voterId(0), true), 'activity_not_found');
  });

  test('trip_not_found', async () => {
    const { acts } = await trip();
    await expectCode(vote(anon, 'NOSUCHID', acts[0].id, voterId(0), true), 'trip_not_found');
  });

  test('invalid_input for a missing on/off flag', async () => {
    const { id, acts } = await trip();
    await expectCode(vote(anon, id, acts[0].id, voterId(0), null), 'invalid_input');
  });

  test('voting_closed by status, for both vote and withdraw', async () => {
    const { id, acts } = await trip();
    await vote(anon, id, acts[0].id, voterId(0), true);
    await closeByStatus(db, id);
    await expectCode(vote(anon, id, acts[1].id, voterId(0), true), 'voting_closed');
    await expectCode(vote(anon, id, acts[0].id, voterId(0), false), 'voting_closed');
    await expectCode(vote(anon, id, acts[2].id, voterId(0), false), 'voting_closed');
    expect((await standing(db, id)).find((r) => r.activity_id === acts[0].id).cast_votes).toBe(1);
  });

  test('voting_closed by passed deadline with status still open', async () => {
    const { id, acts } = await trip();
    await closeByDeadline(db, id);
    expect((await summary(db, id)).status).toBe('open');
    await expectCode(vote(anon, id, acts[1].id, voterId(0), true), 'voting_closed');
  });
});

describe('activities: add, update, remove', () => {
  const add = (id, a) => call('select public.add_activity($1, $2::jsonb) as id', [id, JSON.stringify(a)]);

  test('add_activity stores cleaned values and returns the id', async () => {
    const id = await createTrip(anon);
    const r = await add(id, { title: '  Kayak   trip ', description: 'Two hours', source_url: 'https://example.com/k' });
    const row = (await db.query('select title, description, source_url, trip_id from public.activities where id = $1', [r.rows[0].id])).rows[0];
    expect(row).toEqual({ title: 'Kayak trip', description: 'Two hours', source_url: 'https://example.com/k', trip_id: id });
  });

  test('add_activity validation and errors', async () => {
    const id = await createTrip(anon);
    await expectCode(add(id, { title: 'ab' }), 'invalid_input');
    await expectCode(add(id, { title: rep('t', 81) }), 'invalid_input');
    await expectCode(add(id, { title: 'Good one', description: rep('d', 141) }), 'invalid_input');
    await expectCode(add(id, { title: 'Good one', source_url: 'nope' }), 'invalid_input');
    await expectCode(add(id, { title: 'Bad\x01one' }), 'invalid_input');
    await expectCode(call("select public.add_activity($1, '[]'::jsonb)", [id]), 'invalid_input');
    await expectCode(add('NOSUCHID', { title: 'Good one' }), 'trip_not_found');
  });

  test('30 activities allowed, the 31st is too_many_activities', async () => {
    const id = await createTrip(anon);
    for (let i = 3; i < 30; i++) await add(id, { title: `Extra ${i}` });
    expect((await activitiesOf(db, id)).length).toBe(30);
    const err = await expectCode(add(id, { title: 'One too many' }), 'too_many_activities');
    expect(err.message).toContain('30');
    expect((await activitiesOf(db, id)).length).toBe(30);
    await expectCode(db.query("insert into public.activities (trip_id, title) values ($1, 'Direct insert')", [id]), 'too_many_activities');
    // removing one makes room again
    const acts = await activitiesOf(db, id);
    await call('select public.remove_activity($1)', [acts[29].id]);
    await add(id, { title: 'Fits again' });
  });

  test('update_activity replaces values and clears absent optional fields', async () => {
    const id = await createTrip(anon);
    const a = (await activitiesOf(db, id))[0];
    await call('select public.update_activity($1, $2::jsonb)', [a.id, JSON.stringify({ title: 'New title' })]);
    const row = (await db.query('select title, description, source_url from public.activities where id = $1', [a.id])).rows[0];
    expect(row).toEqual({ title: 'New title', description: null, source_url: null });
  });

  test('update_activity errors', async () => {
    const id = await createTrip(anon);
    const a = (await activitiesOf(db, id))[0];
    await expectCode(call('select public.update_activity($1, $2::jsonb)', [a.id, JSON.stringify({ title: 'x' })]), 'invalid_input');
    await expectCode(call('select public.update_activity($1, $2::jsonb)', ['00000000-0000-0000-0000-000000000000', JSON.stringify({ title: 'Good one' })]), 'activity_not_found');
  });

  test('remove_activity returns the vote count and deletes the votes', async () => {
    const id = await createTrip(anon);
    const acts = await activitiesOf(db, id);
    await join(anon, id, voterId(1), 'Sam');
    await vote(anon, id, acts[1].id, voterId(0));
    await vote(anon, id, acts[1].id, voterId(1));
    await vote(anon, id, acts[2].id, voterId(1));
    const r = await call('select public.remove_activity($1) as n', [acts[1].id]);
    expect(r.rows[0].n).toBe(2);
    expect((await db.query('select count(*)::int as n from public.votes where trip_id = $1', [id])).rows[0].n).toBe(1);
    const none = await call('select public.remove_activity($1) as n', [acts[2].id]);
    expect(none.rows[0].n).toBe(1);
  });

  test('removing the default pick moves it to the earliest remaining activity', async () => {
    const id = await createTrip(anon);
    const acts = await activitiesOf(db, id);
    await call('select public.remove_activity($1)', [acts[0].id]);
    expect((await summary(db, id)).default_activity_id).toBe(acts[1].id);
    expect((await db.query('select default_activity_id from public.trips where id = $1', [id])).rows[0].default_activity_id).toBe(acts[1].id);
  });

  test('removing a non-default activity leaves the default alone', async () => {
    const id = await createTrip(anon);
    const acts = await activitiesOf(db, id);
    await call('select public.set_default_pick($1, $2)', [id, acts[2].id]);
    await call('select public.remove_activity($1)', [acts[0].id]);
    expect((await summary(db, id)).default_activity_id).toBe(acts[2].id);
  });

  test('the last activity of a trip cannot be removed, so a trip is never empty', async () => {
    const id = await createTrip(anon);
    const acts = await activitiesOf(db, id);
    await call('select public.remove_activity($1)', [acts[0].id]);
    await call('select public.remove_activity($1)', [acts[1].id]);
    await expectCode(call('select public.remove_activity($1)', [acts[2].id]), 'invalid_input');
    const s = await summary(db, id);
    expect(s.activity_count).toBe(1);
    expect(s.default_activity_id).toBe(acts[2].id);
    await add(id, { title: 'Fresh start' });
    await call('select public.remove_activity($1)', [acts[2].id]);
    expect((await summary(db, id)).activity_count).toBe(1);
  });

  test('remove_activity on an unknown activity', async () => {
    await expectCode(call('select public.remove_activity($1)', ['00000000-0000-0000-0000-000000000000']), 'activity_not_found');
  });
});

describe('set_default_pick', () => {
  test('changes the pick, rejects foreign and unknown activities', async () => {
    const id = await createTrip(anon);
    const other = await createTrip(anon);
    const acts = await activitiesOf(db, id);
    const foreign = (await activitiesOf(db, other))[0];
    await call('select public.set_default_pick($1, $2)', [id, acts[2].id]);
    expect((await summary(db, id)).default_activity_id).toBe(acts[2].id);
    await expectCode(call('select public.set_default_pick($1, $2)', [id, foreign.id]), 'activity_not_found');
    await expectCode(call('select public.set_default_pick($1, $2)', [id, null]), 'activity_not_found');
    await expectCode(call('select public.set_default_pick($1, $2)', ['NOSUCHID', acts[0].id]), 'trip_not_found');
  });
});

describe('update_trip', () => {
  const upd = (id, p) => call('select public.update_trip($1, $2::jsonb)', [id, JSON.stringify(p)]);

  test('changes any listed field and leaves others', async () => {
    const id = await createTrip(anon);
    await upd(id, { name: 'New name', destination: 'Boston', start_date: '2026-11-01', end_date: '2026-11-03', itinerary_size: 2, voting_deadline: '2099-06-01T12:00:00Z' });
    const t = (await db.query('select * from public.trips where id = $1', [id])).rows[0];
    expect(t.name).toBe('New name');
    expect(t.destination).toBe('Boston');
    expect(t.itinerary_size).toBe(2);
    expect(t.voting_deadline.toISOString()).toBe('2099-06-01T12:00:00.000Z');
    await upd(id, { itinerary_size: 5 });
    const t2 = (await db.query('select name, itinerary_size from public.trips where id = $1', [id])).rows[0];
    expect(t2).toEqual({ name: 'New name', itinerary_size: 5 });
  });

  test('an empty payload changes nothing', async () => {
    const id = await createTrip(anon);
    await upd(id, {});
    expect((await summary(db, id)).name).toBe('Cape Cod, October');
  });

  test.each([
    [{ name: 'ab' }],
    [{ name: rep('n', 61) }],
    [{ name: null }],
    [{ destination: 'x' }],
    [{ itinerary_size: 0 }],
    [{ itinerary_size: 31 }],
    [{ itinerary_size: 1.5 }],
    [{ start_date: 'garbage' }],
    [{ end_date: '2026-10-01' }],
    [{ start_date: '2026-10-20' }],
    [{ voting_deadline: 'soon' }],
  ])('rejects %j', async (p) => {
    const id = await createTrip(anon);
    await expectCode(upd(id, p), 'invalid_input');
  });

  test('size limits at the edges', async () => {
    const id = await createTrip(anon);
    await upd(id, { itinerary_size: 1 });
    await upd(id, { itinerary_size: 30 });
  });

  test('deadline in the past is deadline_passed', async () => {
    const id = await createTrip(anon);
    await expectCode(upd(id, { voting_deadline: PAST }), 'deadline_passed');
  });

  test('trip_not_found', async () => {
    await expectCode(upd('NOSUCHID', { name: 'Anything' }), 'trip_not_found');
  });

  test('blocked when closed by status or by deadline', async () => {
    const a = await createTrip(anon);
    await closeByStatus(db, a);
    await expectCode(upd(a, { name: 'Changed' }), 'voting_closed');
    const b = await createTrip(anon);
    await closeByDeadline(db, b);
    await expectCode(upd(b, { itinerary_size: 2 }), 'voting_closed');
    await expectCode(upd(b, { voting_deadline: FUTURE }), 'voting_closed');
  });
});

describe('close_trip and reopen_trip', () => {
  test('close sets status and time, and is idempotent', async () => {
    const id = await createTrip(anon);
    await call('select public.close_trip($1)', [id]);
    const s = await summary(db, id);
    expect(s.status).toBe('closed');
    expect(s.effective_status).toBe('closed');
    expect(s.closed_at).toBeInstanceOf(Date);
    const first = s.closed_at.getTime();
    await call('select public.close_trip($1)', [id]);
    expect((await summary(db, id)).closed_at.getTime()).toBe(first);
    await expectCode(call('select public.close_trip($1)', ['NOSUCHID']), 'trip_not_found');
  });

  test('reopen with a future stored deadline needs no new deadline', async () => {
    const id = await createTrip(anon);
    await call('select public.close_trip($1)', [id]);
    await call('select public.reopen_trip($1)', [id]);
    const s = await summary(db, id);
    expect(s.status).toBe('open');
    expect(s.effective_status).toBe('open');
    expect(s.closed_at).toBeNull();
  });

  test('reopen after the deadline passed requires a future deadline', async () => {
    const id = await createTrip(anon);
    await call('select public.close_trip($1)', [id]);
    await closeByDeadline(db, id);
    await expectCode(call('select public.reopen_trip($1)', [id]), 'deadline_passed');
    await expectCode(call('select public.reopen_trip($1, $2)', [id, PAST]), 'deadline_passed');
    expect((await summary(db, id)).status).toBe('closed');
    await call('select public.reopen_trip($1, $2)', [id, FUTURE]);
    const s = await summary(db, id);
    expect(s.effective_status).toBe('open');
    expect(s.voting_deadline.toISOString()).toBe('2099-01-01T00:00:00.000Z');
  });

  test('reopen on a trip closed only by deadline works with a new deadline', async () => {
    const id = await createTrip(anon);
    await closeByDeadline(db, id);
    await call('select public.reopen_trip($1, $2)', [id, FUTURE]);
    expect((await summary(db, id)).effective_status).toBe('open');
  });

  test('reopen may also move the deadline while the old one is still ahead', async () => {
    const id = await createTrip(anon);
    await call('select public.close_trip($1)', [id]);
    await call('select public.reopen_trip($1, $2)', [id, '2098-01-01T00:00:00Z']);
    expect((await summary(db, id)).voting_deadline.toISOString()).toBe('2098-01-01T00:00:00.000Z');
  });

  test('reopen restores voting and editing', async () => {
    const id = await createTrip(anon);
    const acts = await activitiesOf(db, id);
    await call('select public.close_trip($1)', [id]);
    await expectCode(vote(anon, id, acts[0].id, voterId(0)), 'voting_closed');
    await call('select public.reopen_trip($1)', [id]);
    await vote(anon, id, acts[0].id, voterId(0));
    await call('select public.add_activity($1, $2::jsonb)', [id, JSON.stringify({ title: 'After reopen' })]);
    await expectCode(call('select public.reopen_trip($1)', ['NOSUCHID']), 'trip_not_found');
  });
});

describe('closed-trip triggers', () => {
  const closers = [
    ['status', closeByStatus],
    ['passed deadline', closeByDeadline],
  ];
  describe.each(closers)('closed by %s', (_label, closer) => {
    test('votes: insert, update, delete are all blocked; reads still work', async () => {
      const id = await createTrip(anon);
      const acts = await activitiesOf(db, id);
      await vote(anon, id, acts[0].id, voterId(0));
      await closer(db, id);
      await expectCode(db.query('insert into public.votes (trip_id, activity_id, voter) values ($1, $2, $3)', [id, acts[1].id, voterId(0)]), 'voting_closed');
      await expectCode(db.query('update public.votes set activity_id = $2 where trip_id = $1', [id, acts[1].id]), 'voting_closed');
      await expectCode(db.query('delete from public.votes where trip_id = $1', [id]), 'voting_closed');
      expect((await standing(db, id)).length).toBe(3);
    });

    test('activities: insert, update, delete are all blocked', async () => {
      const id = await createTrip(anon);
      const acts = await activitiesOf(db, id);
      await closer(db, id);
      await expectCode(db.query("insert into public.activities (trip_id, title) values ($1, 'Late addition')", [id]), 'voting_closed');
      await expectCode(db.query("update public.activities set title = 'Changed it' where id = $1", [acts[0].id]), 'voting_closed');
      await expectCode(db.query('delete from public.activities where id = $1', [acts[0].id]), 'voting_closed');
      await expectCode(call('select public.add_activity($1, $2::jsonb)', [id, JSON.stringify({ title: 'Late addition' })]), 'voting_closed');
      await expectCode(call('select public.update_activity($1, $2::jsonb)', [acts[0].id, JSON.stringify({ title: 'Changed it' })]), 'voting_closed');
      await expectCode(call('select public.remove_activity($1)', [acts[0].id]), 'voting_closed');
      await expectCode(call('select public.set_default_pick($1, $2)', [id, acts[1].id]), 'voting_closed');
      expect((await activitiesOf(db, id)).length).toBe(3);
    });

    test('a closed trip can still be deleted with its name', async () => {
      const id = await createTrip(anon);
      const acts = await activitiesOf(db, id);
      await vote(anon, id, acts[0].id, voterId(0));
      await closer(db, id);
      const r = await call('select public.delete_trip($1, $2) as r', [id, 'Cape Cod, October']);
      expect(r.rows[0].r).toEqual({ activities: 3, votes: 1, members: 1 });
    });
  });

  test('trip_is_closed follows status and deadline and treats unknown as open', async () => {
    const id = await createTrip(anon);
    const q = async (x) => (await call('select public.trip_is_closed($1) as c', [x])).rows[0].c;
    expect(await q(id)).toBe(false);
    await closeByStatus(db, id);
    expect(await q(id)).toBe(true);
    await call('select public.reopen_trip($1)', [id]);
    expect(await q(id)).toBe(false);
    await closeByDeadline(db, id);
    expect(await q(id)).toBe(true);
    expect(await q('NOSUCHID')).toBe(false);
  });

  test('deadline equal to now counts as closed', async () => {
    const id = await createTrip(anon);
    await db.query('update public.trips set voting_deadline = now() where id = $1', [id]);
    expect((await call('select public.trip_is_closed($1) as c', [id])).rows[0].c).toBe(true);
  });
});

describe('delete_trip', () => {
  test('requires the exact name and reports counts', async () => {
    const id = await createTrip(anon);
    const acts = await activitiesOf(db, id);
    await join(anon, id, voterId(1), 'Sam');
    await vote(anon, id, acts[0].id, voterId(0));
    await vote(anon, id, acts[1].id, voterId(0));
    await vote(anon, id, acts[1].id, voterId(1));
    for (const bad of ['cape cod, october', 'Cape Cod, October ', '', null, 'Cape Cod']) {
      await expectCode(call('select public.delete_trip($1, $2)', [id, bad]), 'name_mismatch');
    }
    expect(await summary(db, id)).toBeDefined();
    const r = await call('select public.delete_trip($1, $2) as r', [id, 'Cape Cod, October']);
    expect(r.rows[0].r).toEqual({ activities: 3, votes: 3, members: 2 });
    for (const t of ['trips', 'activities', 'members', 'votes']) {
      const col = t === 'trips' ? 'id' : 'trip_id';
      expect((await db.query(`select count(*)::int as n from public.${t} where ${col} = $1`, [id])).rows[0].n).toBe(0);
    }
  });

  test('trip_not_found, and a second delete fails', async () => {
    const id = await createTrip(anon);
    await call('select public.delete_trip($1, $2)', [id, 'Cape Cod, October']);
    await expectCode(call('select public.delete_trip($1, $2)', [id, 'Cape Cod, October']), 'trip_not_found');
  });

  test('other trips are untouched', async () => {
    const a = await createTrip(anon);
    const b = await createTrip(anon);
    await call('select public.delete_trip($1, $2)', [a, 'Cape Cod, October']);
    expect((await activitiesOf(db, b)).length).toBe(3);
  });
});

describe('access: grants and row level security', () => {
  test.each([['anon'], ['authenticated']])('%s can call the public functions and read the views', async (role) => {
    const c = role === 'anon' ? anon : ctx.authed;
    const id = (await c.query('select public.create_trip($1::jsonb) as id', [JSON.stringify(tripInput())])).rows[0].id;
    for (const v of ['trip_summary', 'trip_standing', 'trip_voters', 'trip_members']) {
      await c.query(`select * from public.${v} where trip_id = $1`, [id]);
    }
    const r = await c.query('select * from public.trips where id = $1', [id]);
    expect(r.rows).toHaveLength(1);
    await c.query('select count(*) from public.activities');
    await c.query('select count(*) from public.members');
    await c.query('select count(*) from public.votes');
  });

  test('views return the data to anon (security invoker still sees rows)', async () => {
    const id = await createTrip(anon);
    const r = await anon.query('select count(*)::int as n from public.trip_standing where trip_id = $1', [id]);
    expect(r.rows[0].n).toBe(3);
  });

  test.each([
    ["insert into public.trips (id, name, destination, start_date, end_date, itinerary_size, voting_deadline) values ('AAAAAAAA','Test trip','Somewhere','2026-10-10','2026-10-11',3,'2099-01-01')"],
    ["update public.trips set name = 'Hacked name'"],
    ['delete from public.trips'],
    ["insert into public.activities (trip_id, title) values ('AAAAAAAA', 'Sneaky')"],
    ['delete from public.activities'],
    ["insert into public.members (trip_id, voter, display_name) values ('AAAAAAAA', 'voter-9999', 'Sneaky')"],
    ['delete from public.members'],
    ['delete from public.votes'],
    ['select * from public.invites'],
    ["insert into public.invites (trip_id, email) values ('AAAAAAAA', 'x@example.com')"],
  ])('anon cannot write tables directly or read invites: %s', async (sql) => {
    await expect(anon.query(sql)).rejects.toThrow(/permission denied/);
    await expect(ctx.authed.query(sql)).rejects.toThrow(/permission denied/);
  });

  test('internal helpers are not callable by clients', async () => {
    await expect(anon.query("select public._fail('x')")).rejects.toThrow(/permission denied/);
    await expect(anon.query('select public._new_trip_id()')).rejects.toThrow(/permission denied/);
    await expect(anon.query('select public.trg_block_closed()')).rejects.toThrow();
  });

  test('every table has row level security enabled', async () => {
    const r = await db.query("select relname, relrowsecurity from pg_class where relnamespace = 'public'::regnamespace and relkind = 'r' order by relname");
    expect(r.rows.map((x) => [x.relname, x.relrowsecurity])).toEqual([
      ['activities', true], ['invites', true], ['members', true], ['trips', true], ['votes', true],
    ]);
  });

  test('views are security invoker', async () => {
    const r = await db.query("select relname, reloptions from pg_class where relnamespace = 'public'::regnamespace and relkind = 'v' order by relname");
    expect(r.rows.length).toBeGreaterThanOrEqual(4);
    for (const v of r.rows) expect(v.reloptions, v.relname).toContain('security_invoker=true');
  });

  test('all client functions are security definer with a fixed search path', async () => {
    const r = await db.query(`select proname, prosecdef, proconfig from pg_proc
      where pronamespace = 'public'::regnamespace and proname in
      ('create_trip','join_trip','set_vote','add_activity','update_activity','remove_activity','update_trip','set_default_pick','close_trip','reopen_trip','delete_trip')`);
    expect(r.rows).toHaveLength(11);
    for (const f of r.rows) {
      expect(f.prosecdef, f.proname).toBe(true);
      expect(f.proconfig.join(','), f.proname).toContain('search_path=public');
    }
  });
});

describe('realtime', () => {
  test('publication includes the four tables', async () => {
    const r = await db.query("select tablename from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' order by tablename");
    expect(r.rows.map((x) => x.tablename)).toEqual(['activities', 'members', 'trips', 'votes']);
  });
  test('replica identity is full on the four tables', async () => {
    const r = await db.query("select relname, relreplident from pg_class where relnamespace = 'public'::regnamespace and relname in ('votes','activities','members','trips') order by relname");
    expect(r.rows.map((x) => x.relreplident)).toEqual(['f', 'f', 'f', 'f']);
  });
});

describe('migration is repeatable on a fresh database', () => {
  test('applies cleanly to a second fresh database', async () => {
    const other = await setup();
    const id = await createTrip(other.anon);
    expect(id).toHaveLength(8);
  });
});
