// The decision rule (PRD section 5 and section 12 layer 2). Deadlines and status are set directly so nothing depends on the clock.
import { describe, test, expect, beforeAll } from 'vitest';
import {
  setup, build, view, summary, vote, join, voterId, closeByStatus, closeByDeadline, standing,
} from './helpers.js';

let ctx;
beforeAll(async () => {
  ctx = await setup();
});

const V = (...a) => a; // one member's votes, as activity indexes
const NONE = [];

// Each case: members[0] is the organizer. Expected arrays are in rank order after close.
// tie is the tie_broken flag: the last itinerary place and the first place outside it share a total.
const zeros = (n) => Array(n).fill(0);
const cases = [
  {
    name: 'zero votes from three members: default pick gets three default votes, rest in order added',
    size: 3, acts: 5, members: [NONE, NONE, NONE],
    order: [0, 1, 2, 3, 4], total: [3, 0, 0, 0, 0], cast: zeros(5), dflt: [3, 0, 0, 0, 0],
    inItin: [0, 1, 2], tie: true, castTotal: 0, defTotal: 3, notVoted: 3,
  },
  {
    name: 'zero votes with a later default pick: default first, then order added',
    size: 3, acts: 5, defaultIdx: 3, members: [NONE, NONE],
    order: [3, 0, 1, 2, 4], total: [2, 0, 0, 0, 0], cast: zeros(5), dflt: [2, 0, 0, 0, 0],
    inItin: [3, 0, 1], tie: true, castTotal: 0, defTotal: 2, notVoted: 2,
  },
  {
    name: 'two-way tie at the top, size 1: earliest added wins and a tie was broken',
    size: 1, acts: 4, members: [V(1), V(2), V(1, 2)],
    order: [1, 2, 0, 3], total: [2, 2, 0, 0], cast: [2, 2, 0, 0], dflt: zeros(4),
    inItin: [1], tie: true, castTotal: 4, defTotal: 0, notVoted: 0,
  },
  {
    name: 'two-way tie that both make the itinerary (size 2): no tie was broken',
    size: 2, acts: 4, members: [V(1), V(2), V(1, 2)],
    order: [1, 2, 0, 3], total: [2, 2, 0, 0], cast: [2, 2, 0, 0], dflt: zeros(4),
    inItin: [1, 2], tie: false, castTotal: 4, defTotal: 0, notVoted: 0,
  },
  {
    name: 'two-way tie: default pick beats the earlier activity',
    size: 1, acts: 4, defaultIdx: 2, members: [V(1), V(2)],
    order: [2, 1, 0, 3], total: [1, 1, 0, 0], cast: [1, 1, 0, 0], dflt: zeros(4),
    inItin: [2], tie: true, castTotal: 2, defTotal: 0, notVoted: 0,
  },
  {
    name: 'three-way tie at last place (size 2), default pick is not in the tie: earliest added first',
    size: 2, acts: 6, members: [V(0), V(0, 1), V(2, 3)],
    order: [0, 1, 2, 3, 4, 5], total: [2, 1, 1, 1, 0, 0], cast: [2, 1, 1, 1, 0, 0], dflt: zeros(6),
    inItin: [0, 1], tie: true, castTotal: 5, defTotal: 0, notVoted: 0,
  },
  {
    name: 'three-way tie at last place (size 2), default pick is in the tie: default first',
    size: 2, acts: 6, defaultIdx: 3, members: [V(0), V(0, 1), V(2, 3)],
    order: [0, 3, 1, 2, 4, 5], total: [2, 1, 1, 1, 0, 0], cast: [2, 1, 1, 1, 0, 0], dflt: zeros(6),
    inItin: [0, 3], tie: true, castTotal: 5, defTotal: 0, notVoted: 0,
  },
  {
    name: 'three-way tie (size 3) cut after its second place: tie broken',
    size: 3, acts: 6, members: [V(0), V(0, 1), V(2, 3)],
    order: [0, 1, 2, 3, 4, 5], total: [2, 1, 1, 1, 0, 0], cast: [2, 1, 1, 1, 0, 0], dflt: zeros(6),
    inItin: [0, 1, 2], tie: true, castTotal: 5, defTotal: 0, notVoted: 0,
  },
  {
    name: 'three-way tie fits wholly inside the itinerary (size 4): no tie broken',
    size: 4, acts: 6, members: [V(0), V(0, 1), V(2, 3)],
    order: [0, 1, 2, 3, 4, 5], total: [2, 1, 1, 1, 0, 0], cast: [2, 1, 1, 1, 0, 0], dflt: zeros(6),
    inItin: [0, 1, 2, 3], tie: false, castTotal: 5, defTotal: 0, notVoted: 0,
  },
  {
    name: 'all members voted: no default votes at all',
    size: 2, acts: 4, members: [V(0, 1), V(1), V(1, 2)],
    order: [1, 0, 2, 3], total: [3, 1, 1, 0], cast: [3, 1, 1, 0], dflt: zeros(4),
    inItin: [1, 0], tie: true, castTotal: 5, defTotal: 0, notVoted: 0,
  },
  {
    name: 'no member voted (same as zero votes), size 1',
    size: 1, acts: 3, members: [NONE, NONE, NONE, NONE],
    order: [0, 1, 2], total: [4, 0, 0], cast: zeros(3), dflt: [4, 0, 0],
    inItin: [0], tie: false, castTotal: 0, defTotal: 4, notVoted: 4,
  },
  {
    name: 'some voters, some not: non-voters each add one default vote to the default pick',
    size: 2, acts: 4, members: [V(2), NONE, NONE, V(2, 3)],
    order: [0, 2, 3, 1], total: [2, 2, 1, 0], cast: [0, 2, 1, 0], dflt: [2, 0, 0, 0],
    inItin: [0, 2], tie: false, castTotal: 3, defTotal: 2, notVoted: 2,
  },
  {
    name: 'fewer activities than itinerary size: all are listed',
    size: 5, acts: 3, members: [V(1), NONE],
    order: [0, 1, 2], total: [1, 1, 0], cast: [0, 1, 0], dflt: [1, 0, 0],
    inItin: [0, 1, 2], tie: false, castTotal: 1, defTotal: 1, notVoted: 1,
  },
  {
    name: 'size 1 with a clear winner',
    size: 1, acts: 4, members: [V(3), V(3), V(1)],
    order: [3, 1, 0, 2], total: [2, 1, 0, 0], cast: [2, 1, 0, 0], dflt: zeros(4),
    inItin: [3], tie: false, castTotal: 3, defTotal: 0, notVoted: 0,
  },
  {
    name: 'size 30 with 30 activities: everything is in, order by votes then order added',
    size: 30, acts: 30, members: [V(29, 5), V(5), NONE],
    tie: false, castTotal: 3, defTotal: 1, notVoted: 1, custom: 'size30',
  },
  {
    name: 'size 30 with 12 activities',
    size: 30, acts: 12, members: [V(11), V(11)],
    order: [11, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10], total: [2, ...zeros(11)], cast: [2, ...zeros(11)], dflt: zeros(12),
    inItin: [11, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10], tie: false, castTotal: 2, defTotal: 0, notVoted: 0,
  },
  {
    name: 'a member who votes for every activity adds one to each',
    size: 2, acts: 3, members: [V(0, 1, 2), V(2)],
    order: [2, 0, 1], total: [2, 1, 1], cast: [2, 1, 1], dflt: zeros(3),
    inItin: [2, 0], tie: true, castTotal: 4, defTotal: 0, notVoted: 0,
  },
];

function checkSize30(v) {
  // member 0 voted 29 and 5, member 1 voted 5, member 2 never voted (default vote to act 0)
  // totals: act5 = 2, act0 = 0 cast + 1 default = 1, act29 = 1, everything else 0
  expect(v.order[0]).toBe(5);
  expect(v.order.slice(1, 3)).toEqual([0, 29]);
  expect(v.order.slice(3)).toEqual(Array.from({ length: 28 }, (_, i) => i + 1).filter((x) => x !== 5));
  expect(v.total.slice(0, 4)).toEqual([2, 1, 1, 0]);
  expect(v.dflt[1]).toBe(1);
  expect(v.order).toHaveLength(30);
  expect(new Set(v.order).size).toBe(30);
  expect(v.inItin).toHaveLength(30);
}

describe('decision rule after close, by status', () => {
  test.each(cases)('$name', async (c) => {
    const { id } = await build(ctx, { size: c.size, acts: c.acts, defaultIdx: c.defaultIdx ?? 0, members: c.members });
    await closeByStatus(ctx.db, id);
    const v = await view(ctx.db, id);
    const s = await summary(ctx.db, id);
    if (c.custom === 'size30') {
      checkSize30(v);
    } else {
      expect(v.order).toEqual(c.order);
      expect(v.total).toEqual(c.total);
      expect(v.cast).toEqual(c.cast);
      expect(v.dflt).toEqual(c.dflt);
      expect(v.inItin).toEqual(c.inItin);
    }
    expect(s.effective_status).toBe('closed');
    expect(s.tie_broken).toBe(c.tie);
    expect(s.cast_votes_total).toBe(c.castTotal);
    expect(s.default_votes_total).toBe(c.defTotal);
    expect(s.not_voted_count).toBe(c.notVoted);
    expect(s.member_count).toBe(c.members.length);
    expect(s.voted_count).toBe(c.members.filter((m) => m.length > 0).length);
    expect(s.activity_count).toBe(c.acts);
  });
});

describe('the same rule applies when closed by a passed deadline', () => {
  test.each(cases.filter((c) => c.custom !== 'size30'))('$name', async (c) => {
    const { id } = await build(ctx, { size: c.size, acts: c.acts, defaultIdx: c.defaultIdx ?? 0, members: c.members });
    await closeByDeadline(ctx.db, id);
    const v = await view(ctx.db, id);
    expect(v.order).toEqual(c.order);
    expect(v.total).toEqual(c.total);
    expect(v.dflt).toEqual(c.dflt);
    expect((await summary(ctx.db, id)).default_votes_total).toBe(c.defTotal);
  });
});

describe('tie_broken flag', () => {
  // Boundary tie means the last itinerary place and the first place outside it share a total.
  test.each([
    ['tie straddles the boundary', { size: 1, acts: 3, members: [V(1), V(2)] }, true],
    ['tie entirely inside the itinerary', { size: 2, acts: 4, members: [V(1), V(2), V(1, 2)] }, false],
    ['tie entirely outside the itinerary', { size: 1, acts: 4, members: [V(0), V(0), V(1), V(2)] }, false],
    ['no ties anywhere', { size: 2, acts: 3, members: [V(0, 1), V(0), V(0)] }, false],
    ['zero-vote tie across the boundary', { size: 2, acts: 4, members: [V(0), V(0)] }, true],
    ['size at or above activity count', { size: 3, acts: 3, members: [V(0), V(1)] }, false],
    ['size 1, one activity voted and one default', { size: 1, acts: 3, members: [V(1), NONE] }, true],
  ])('%s', async (_n, opts, expected) => {
    const { id } = await build(ctx, opts);
    await closeByStatus(ctx.db, id);
    expect((await summary(ctx.db, id)).tie_broken).toBe(expected);
  });
});

describe('default votes arrive only at close', () => {
  test('open trip shows no default votes; closing adds one per non-voter; reopening removes them', async () => {
    const { id, ids } = await build(ctx, { size: 2, acts: 4, members: [V(1), NONE, NONE, V(2)] });
    let v = await view(ctx.db, id);
    expect(v.dflt).toEqual([0, 0, 0, 0]);
    let s = await summary(ctx.db, id);
    expect(s.effective_status).toBe('open');
    expect(s.default_votes_total).toBe(0);
    expect(s.not_voted_count).toBe(2);
    expect(v.total).toEqual(v.cast);

    await ctx.anon.query('select public.close_trip($1)', [id]);
    v = await view(ctx.db, id);
    expect(v.dflt).toEqual([2, 0, 0, 0]);
    expect(v.order).toEqual([0, 1, 2, 3]);
    expect(v.total).toEqual([2, 1, 1, 0]);
    s = await summary(ctx.db, id);
    expect(s.default_votes_total).toBe(2);
    expect(s.effective_status).toBe('closed');

    await ctx.anon.query('select public.reopen_trip($1)', [id]);
    v = await view(ctx.db, id);
    expect(v.dflt).toEqual([0, 0, 0, 0]);
    expect((await summary(ctx.db, id)).effective_status).toBe('open');
    expect((await summary(ctx.db, id)).closed_at).toBeNull();
    // voting works again and changes the standing
    await vote(ctx.anon, id, ids[3], voterId(1));
    v = await view(ctx.db, id);
    expect(v.cast).toEqual([1, 1, 1, 0]);
    expect((await summary(ctx.db, id)).not_voted_count).toBe(1);
  });

  test('before close the order still follows the rule (default first, then order added)', async () => {
    const { id } = await build(ctx, { size: 2, acts: 4, defaultIdx: 2, members: [NONE, NONE] });
    const v = await view(ctx.db, id);
    expect(v.order).toEqual([2, 0, 1, 3]);
    expect(v.total).toEqual([0, 0, 0, 0]);
  });

  test('a member who withdraws every vote becomes a non-voter', async () => {
    const { id, ids } = await build(ctx, { size: 2, acts: 3, members: [V(1), V(2)] });
    await vote(ctx.anon, id, ids[2], voterId(1), false);
    let s = await summary(ctx.db, id);
    expect(s.voted_count).toBe(1);
    expect(s.not_voted_count).toBe(1);
    await closeByStatus(ctx.db, id);
    const v = await view(ctx.db, id);
    expect(v.dflt).toEqual([1, 0, 0]);
    expect(v.total).toEqual([1, 1, 0]);
    s = await summary(ctx.db, id);
    expect(s.default_votes_total).toBe(1);
  });

  test('a member who joins after votes exist counts as a non-voter at close', async () => {
    const { id } = await build(ctx, { size: 2, acts: 3, members: [V(1)] });
    await join(ctx.anon, id, voterId(5), 'Late Joiner');
    await closeByStatus(ctx.db, id);
    const s = await summary(ctx.db, id);
    expect(s.member_count).toBe(2);
    expect(s.not_voted_count).toBe(1);
    expect(s.default_votes_total).toBe(1);
  });
});

describe('default pick changes and removal', () => {
  test('default pick removed: earliest remaining becomes the pick and takes the default votes', async () => {
    const { id, ids } = await build(ctx, { size: 2, acts: 4, members: [V(3), NONE, NONE] });
    await ctx.anon.query('select public.remove_activity($1)', [ids[0]]);
    await closeByStatus(ctx.db, id);
    const rows = await standing(ctx.db, id);
    expect(rows.map((r) => r.title)).toEqual(['Act 01', 'Act 03', 'Act 02']);
    expect(rows.map((r) => r.default_votes)).toEqual([2, 0, 0]);
    expect(rows.map((r) => r.total_votes)).toEqual([2, 1, 0]);
    expect(rows[0].is_default_pick).toBe(true);
    expect((await summary(ctx.db, id)).default_activity_id).toBe(ids[1]);
  });

  test('default pick set by an organizer wins ties over an earlier activity', async () => {
    const { id, ids } = await build(ctx, { size: 1, acts: 3, members: [V(0, 2), V(0, 2)] });
    await ctx.anon.query('select public.set_default_pick($1, $2)', [id, ids[2]]);
    await closeByStatus(ctx.db, id);
    const v = await view(ctx.db, id);
    expect(v.order).toEqual([2, 0, 1]);
    expect(v.inItin).toEqual([2]);
  });

  test('a null default pick (activity deleted behind the functions) falls back to the earliest activity', async () => {
    const { id, ids } = await build(ctx, { size: 2, acts: 4, members: [NONE, NONE] });
    await ctx.db.query('delete from public.activities where id = $1', [ids[0]]);
    expect((await ctx.db.query('select default_activity_id from public.trips where id = $1', [id])).rows[0].default_activity_id).toBeNull();
    await closeByStatus(ctx.db, id);
    const s = await summary(ctx.db, id);
    expect(s.default_activity_id).toBe(ids[1]);
    const v = await view(ctx.db, id);
    expect(v.order).toEqual([1, 2, 3]);
    expect(v.dflt).toEqual([2, 0, 0]);
  });

  test('votes on the removed default stay out of the standing', async () => {
    const { id, ids } = await build(ctx, { size: 2, acts: 3, members: [V(0), V(0, 1)] });
    const r = await ctx.anon.query('select public.remove_activity($1) as n', [ids[0]]);
    expect(r.rows[0].n).toBe(2);
    await closeByStatus(ctx.db, id);
    const s = await summary(ctx.db, id);
    expect(s.cast_votes_total).toBe(1);
    expect(s.voted_count).toBe(1);
    expect(s.not_voted_count).toBe(1);
    const v = await view(ctx.db, id);
    expect(v.order).toEqual([1, 2]);
    expect(v.total).toEqual([2, 0]);
  });
});

describe('no members at all', () => {
  test('zero members and zero votes: default first, then order added, no default votes', async () => {
    const { id } = await build(ctx, { size: 2, acts: 3, defaultIdx: 1, members: [NONE] });
    await ctx.db.query('delete from public.members where trip_id = $1', [id]);
    await closeByStatus(ctx.db, id);
    const v = await view(ctx.db, id);
    expect(v.order).toEqual([1, 0, 2]);
    expect(v.total).toEqual([0, 0, 0]);
    const s = await summary(ctx.db, id);
    expect(s.member_count).toBe(0);
    expect(s.default_votes_total).toBe(0);
  });
});

describe('rank stability and shape', () => {
  test('ranks are a permutation of 1..n, repeated reads agree, and order does not depend on insertion of unrelated rows', async () => {
    const { id, ids } = await build(ctx, { size: 3, acts: 8, members: [V(1, 2, 3), V(2, 3), V(3)] });
    const a = await standing(ctx.db, id);
    const b = await standing(ctx.db, id);
    expect(b.map((r) => r.activity_id)).toEqual(a.map((r) => r.activity_id));
    expect(a.map((r) => r.rank)).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
    expect(a.map((r) => r.title).slice(0, 4)).toEqual(['Act 03', 'Act 02', 'Act 01', 'Act 00']);
    // another trip with the same shape does not disturb this one
    await build(ctx, { size: 3, acts: 8, members: [V(7), V(7)] });
    const c = await standing(ctx.db, id);
    expect(c.map((r) => r.activity_id)).toEqual(a.map((r) => r.activity_id));
    // an activity added later never outranks an equal earlier one
    await ctx.anon.query('select public.add_activity($1, $2::jsonb)', [id, JSON.stringify({ title: 'Act 08' })]);
    const d = await standing(ctx.db, id);
    expect(d.map((r) => r.title).slice(-2)).toEqual(['Act 07', 'Act 08']);
    expect(ids).toHaveLength(8);
  });

  test('in_itinerary marks exactly the first itinerary_size ranks', async () => {
    const { id } = await build(ctx, { size: 4, acts: 9, members: [V(5), V(6)] });
    const rows = await standing(ctx.db, id);
    expect(rows.filter((r) => r.in_itinerary).map((r) => r.rank)).toEqual([1, 2, 3, 4]);
  });

  test('changing the itinerary size changes membership of the itinerary without touching ranks', async () => {
    const { id } = await build(ctx, { size: 2, acts: 5, members: [V(4), V(3)] });
    const before = (await standing(ctx.db, id)).map((r) => r.activity_id);
    await ctx.anon.query('select public.update_trip($1, $2::jsonb)', [id, JSON.stringify({ itinerary_size: 4 })]);
    const rows = await standing(ctx.db, id);
    expect(rows.map((r) => r.activity_id)).toEqual(before);
    expect(rows.filter((r) => r.in_itinerary)).toHaveLength(4);
  });

  test('exactly one default pick per trip', async () => {
    const { id } = await build(ctx, { size: 2, acts: 6, defaultIdx: 4, members: [V(1)] });
    const rows = await standing(ctx.db, id);
    expect(rows.filter((r) => r.is_default_pick)).toHaveLength(1);
    expect(rows.find((r) => r.is_default_pick).title).toBe('Act 04');
  });
});

describe('summary view', () => {
  test('carries trip facts, day count, and counts', async () => {
    const { id } = await build(ctx, { size: 3, acts: 4, members: [V(1), V(1, 2), NONE] });
    const s = await summary(ctx.db, id);
    expect(s).toMatchObject({
      trip_id: id, name: 'Cape Cod, October', destination: 'Provincetown, MA', day_count: 5, itinerary_size: 3,
      status: 'open', effective_status: 'open', closed_at: null, member_count: 3, voted_count: 2, not_voted_count: 1,
      cast_votes_total: 3, default_votes_total: 0, activity_count: 4,
    });
    expect(s.as_of).toBeInstanceOf(Date);
    expect(Math.abs(s.as_of.getTime() - Date.now())).toBeLessThan(60000);
  });

  test('day count is inclusive and handles a one-day trip and a long trip', async () => {
    const { id } = await build(ctx, { size: 1, acts: 3, members: [NONE] });
    await ctx.db.query("update public.trips set start_date = '2026-10-10', end_date = '2026-10-10' where id = $1", [id]);
    expect((await summary(ctx.db, id)).day_count).toBe(1);
    await ctx.db.query("update public.trips set start_date = '2026-01-01', end_date = '2026-12-31' where id = $1", [id]);
    expect((await summary(ctx.db, id)).day_count).toBe(365);
  });

  test('closed_at shows the stored time when closed by hand and the deadline when closed by the deadline', async () => {
    const a = await build(ctx, { size: 1, acts: 3, members: [NONE] });
    await ctx.anon.query('select public.close_trip($1)', [a.id]);
    const sa = await summary(ctx.db, a.id);
    const stored = (await ctx.db.query('select closed_at from public.trips where id = $1', [a.id])).rows[0].closed_at;
    expect(sa.closed_at.getTime()).toBe(stored.getTime());
    const b = await build(ctx, { size: 1, acts: 3, members: [NONE] });
    await ctx.db.query("update public.trips set voting_deadline = '2026-01-01T12:00:00Z' where id = $1", [b.id]);
    const sb = await summary(ctx.db, b.id);
    expect(sb.effective_status).toBe('closed');
    expect(sb.status).toBe('open');
    expect(sb.closed_at.toISOString()).toBe('2026-01-01T12:00:00.000Z');
  });
});

describe('voters and members views', () => {
  test('trip_voters lists who voted for what, with names and times; trip_members shows has_voted', async () => {
    const { id, ids } = await build(ctx, { size: 2, acts: 3, members: [V(1), V(1, 2), NONE] });
    const vs = (await ctx.db.query('select * from public.trip_voters where trip_id = $1 order by voted_at', [id])).rows;
    expect(vs).toHaveLength(3);
    expect(vs.filter((r) => r.activity_id === ids[1]).map((r) => r.display_name).sort()).toEqual(['Member 1', 'Pat Jones']);
    expect(vs.every((r) => r.voted_at instanceof Date)).toBe(true);
    const ms = (await ctx.db.query('select display_name, role, has_voted from public.trip_members where trip_id = $1 order by joined_at, display_name', [id])).rows;
    expect(ms).toHaveLength(3);
    expect(ms.find((m) => m.display_name === 'Pat Jones')).toEqual({ display_name: 'Pat Jones', role: 'organizer', has_voted: true });
    expect(ms.find((m) => m.display_name === 'Member 2')).toEqual({ display_name: 'Member 2', role: 'member', has_voted: false });
  });

  test('vote times are in the order the votes were cast', async () => {
    const { id, ids } = await build(ctx, { size: 2, acts: 3, members: [NONE] });
    await vote(ctx.anon, id, ids[0], voterId(0));
    await vote(ctx.anon, id, ids[1], voterId(0));
    await vote(ctx.anon, id, ids[2], voterId(0));
    const r = (await ctx.db.query('select activity_id from public.trip_voters where trip_id = $1 order by voted_at', [id])).rows;
    expect(r.map((x) => x.activity_id)).toEqual(ids);
  });
});

describe('views are isolated per trip', () => {
  test('votes and members of one trip never affect another', async () => {
    const a = await build(ctx, { size: 1, acts: 3, members: [V(2), V(2)] });
    const b = await build(ctx, { size: 1, acts: 3, members: [V(1)] });
    await closeByStatus(ctx.db, a.id);
    await closeByStatus(ctx.db, b.id);
    expect((await view(ctx.db, a.id)).order[0]).toBe(2);
    expect((await view(ctx.db, b.id)).order[0]).toBe(1);
    expect((await summary(ctx.db, a.id)).member_count).toBe(2);
    expect((await summary(ctx.db, b.id)).member_count).toBe(1);
  });
});
