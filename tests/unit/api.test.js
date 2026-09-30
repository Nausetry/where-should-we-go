import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import * as api from '../../js/api.js';
import { fakeClient } from './fakeClient.js';

const TRIP = 'ABCD2345';
const ACT = '11111111-1111-1111-1111-111111111111';
const ok = (data = null) => ({ data, error: null });
const pgErr = (message, code = 'P0001', extra = {}) => ({ data: null, error: { message, code, ...extra } });

function use(opts) {
  const c = fakeClient(opts);
  api._setClient(c);
  return c;
}

let store;
beforeEach(() => {
  store = new Map();
  globalThis.localStorage = {
    getItem: (k) => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => { store.set(k, String(v)); },
  };
  api._resetIdentity();
});
afterEach(() => {
  delete globalThis.localStorage;
  api._setClient(null);
  vi.useRealTimers();
});

describe('mapError', () => {
  test('every contract code has plain wording', () => {
    for (const code of api.ERROR_CODES) {
      const e = api.mapError({ message: code, code: 'P0001' });
      expect(e).toBeInstanceOf(api.ApiError);
      expect(e.code).toBe(code);
      expect(e.message.length).toBeGreaterThan(10);
      expect(e.message).not.toContain(String.fromCharCode(8212));
      expect(e.message).not.toContain(code); // no system terms on screen
    }
  });
  test('code with detail keeps the detail', () => {
    const e = api.mapError({ message: 'invalid_input: itinerary_size', code: 'P0001' });
    expect(e.code).toBe('invalid_input');
    expect(e.detail).toBe('itinerary_size');
    expect(e.message).toBe('The itinerary size was not accepted. Check it and try again.');
  });
  test('activity field paths map to plain words', () => {
    expect(api.mapError({ message: 'invalid_input: activities[2].title' }).message).toMatch(/activity title/);
    expect(api.mapError({ message: 'invalid_input: activities[0].source_url' }).message).toMatch(/web address/);
    expect(api.mapError({ message: 'invalid_input: mystery' }).message).toMatch(/form/);
  });
  test('voting_closed names the time when known', () => {
    const e = api.mapError({ message: 'voting_closed' }, { closedAt: '2026-10-06T01:00:00Z', timeZone: 'America/New_York', kind: 'vote' });
    expect(e.message).toBe('Voting closed at Oct 5, 2026, 9:00 PM EDT. Your vote was not recorded.');
    const c = api.mapError({ message: 'voting_closed' }, { closedAt: '2026-10-06T01:00:00Z', timeZone: 'UTC' });
    expect(c.message).toBe('Voting closed at Oct 6, 2026, 1:00 AM UTC. Your change was not saved.');
    expect(api.mapError({ message: 'voting_closed' }).message).toBe('Voting has closed. Your change was not saved.');
  });
  test('deadline_passed, trip_not_found, name_mismatch use PRD wording', () => {
    expect(api.mapError({ message: 'deadline_passed' }).message).toBe('Choose a deadline that has not passed.');
    expect(api.mapError({ message: 'trip_not_found' }).message).toBe('No trip found for this link. Check the code and try again.');
    expect(api.mapError({ message: 'name_mismatch' }).message).toBe('Type the trip name exactly to delete.');
  });
  test('network failures', () => {
    for (const m of ['Failed to fetch', 'TypeError: NetworkError when attempting to fetch resource.', 'Load failed', 'fetch failed', 'Network request failed']) {
      expect(api.mapError(new TypeError(m)).code).toBe('network');
      expect(api.mapError({ message: m }).code).toBe('network');
    }
    expect(api.mapError({ message: 'x', status: 503 }).code).toBe('network');
    expect(api.mapError('Failed to fetch').code).toBe('network');
  });
  test('constraint and foreign key failures', () => {
    expect(api.mapError({ code: '23514', message: 'new row violates check constraint "activities_title_check"' }).code).toBe('invalid_input');
    expect(api.mapError({ code: '22001', message: 'value too long' }).code).toBe('invalid_input');
    expect(api.mapError({ code: '23503', message: 'violates foreign key constraint', details: 'Key (trip_id, voter) is not present in table "members".' }).code).toBe('not_a_member');
    expect(api.mapError({ code: '23503', message: 'violates foreign key constraint', details: 'Key is not present in table "activities".' }).code).toBe('activity_not_found');
  });
  test('permission failures and unknown failures', () => {
    expect(api.mapError({ code: '42501', message: 'permission denied' }).code).toBe('not_signed_in');
    const u = api.mapError({ code: 'XX000', message: 'boom internal detail' });
    expect(u.code).toBe('unknown');
    expect(u.message).not.toContain('boom');
    expect(api.mapError(null).code).toBe('unknown');
    expect(api.mapError(undefined).code).toBe('unknown');
  });
  test('an ApiError passes through', () => {
    const e = new api.ApiError('not_a_member');
    expect(api.mapError(e)).toBe(e);
  });
  test('a code word inside longer text is found, but not as part of another word', () => {
    expect(api.mapError({ message: 'ERROR: voting_closed (trigger)' }).code).toBe('voting_closed');
    expect(api.mapError({ message: 'xnetworkx' }).code).toBe('unknown');
  });
});

describe('identity in this browser', () => {
  test('voter id is stored, stable, and 8 to 64 safe characters', () => {
    const a = api.getVoterId();
    expect(a).toMatch(/^[A-Za-z0-9_-]{8,64}$/);
    expect(api.getVoterId()).toBe(a);
    expect(store.get('wsg.voter')).toBe(a);
    api._resetIdentity();
    expect(api.getVoterId()).toBe(a); // read back from storage
  });
  test('a different browser gets a different id', () => {
    const a = api.getVoterId();
    store.clear();
    api._resetIdentity();
    expect(api.getVoterId()).not.toBe(a);
  });
  test('a damaged stored id is replaced', () => {
    store.set('wsg.voter', 'x');
    expect(api.getVoterId()).not.toBe('x');
  });
  test('storage that throws falls back to memory', () => {
    globalThis.localStorage = {
      getItem() { throw new Error('blocked'); },
      setItem() { throw new Error('blocked'); },
    };
    const a = api.getVoterId();
    expect(a).toMatch(/^[A-Za-z0-9_-]{8,64}$/);
    expect(api.getVoterId()).toBe(a);
    api.saveName('Pat');
    expect(api.getSavedName()).toBe('Pat');
  });
  test('no localStorage at all', () => {
    delete globalThis.localStorage;
    const a = api.getVoterId();
    expect(api.getVoterId()).toBe(a);
    expect(api.getSavedName()).toBe('');
  });
  test('saved name round trip', () => {
    expect(api.getSavedName()).toBe('');
    api.saveName('Pat Jones');
    expect(api.getSavedName()).toBe('Pat Jones');
    expect(store.get('wsg.name')).toBe('Pat Jones');
  });
});

describe('createTrip', () => {
  const input = {
    name: 'Cape Cod', destination: 'Provincetown, MA', start_date: '2026-10-10', end_date: '2026-10-14',
    voting_deadline: '2026-10-06T01:00:00.000Z', itinerary_size: 2, organizer_name: ' Pat Jones ',
    activities: [
      { title: 'Whale watch', description: '', source_url: '' },
      { title: 'Beach', description: 'Sunny', source_url: ' https://example.com ' },
      { title: 'Lobster' },
    ],
  };
  test('sends the contract payload with this browser voter id and returns the id', async () => {
    const c = use({ rpc: { create_trip: ok(TRIP) } });
    const r = await api.createTrip(input);
    expect(r).toEqual({ id: TRIP });
    const { name, args } = c.calls.rpc[0];
    expect(name).toBe('create_trip');
    expect(args.p.voter).toBe(api.getVoterId());
    expect(args.p.organizer_name).toBe('Pat Jones');
    expect(args.p.itinerary_size).toBe(2);
    expect(args.p.activities).toEqual([
      { title: 'Whale watch', description: null, source_url: null },
      { title: 'Beach', description: 'Sunny', source_url: 'https://example.com' },
      { title: 'Lobster', description: null, source_url: null },
    ]);
    expect(api.getSavedName()).toBe('Pat Jones');
  });
  test('accepts camelCase names', async () => {
    const c = use({ rpc: { create_trip: ok(TRIP) } });
    await api.createTrip({ tripName: 'Cape Cod', destination: 'P', startDate: '2026-10-10', endDate: '2026-10-11', votingDeadline: 'x', itinerarySize: '3', organizerName: 'Pat', activities: [{ title: 'abc', sourceUrl: 'https://a.co' }] });
    const p = c.calls.rpc[0].args.p;
    expect(p.name).toBe('Cape Cod');
    expect(p.itinerary_size).toBe(3);
    expect(p.activities[0].source_url).toBe('https://a.co');
  });
  test('database errors become ApiError and the name is not saved', async () => {
    use({ rpc: { create_trip: pgErr('deadline_passed') } });
    await expect(api.createTrip(input)).rejects.toMatchObject({ name: 'ApiError', code: 'deadline_passed' });
    expect(api.getSavedName()).toBe('');
  });
  test('invalid_input from the database names the field', async () => {
    use({ rpc: { create_trip: pgErr('invalid_input: activities[1].title') } });
    await expect(api.createTrip(input)).rejects.toMatchObject({ code: 'invalid_input', detail: 'activities[1].title' });
  });
  test('a thrown fetch failure is a network error', async () => {
    const c = fakeClient();
    c.rpc = async () => { throw new TypeError('Failed to fetch'); };
    api._setClient(c);
    await expect(api.createTrip(input)).rejects.toMatchObject({ code: 'network' });
  });
});

describe('loadTrip', () => {
  const summary = { trip_id: TRIP, name: 'Cape Cod', effective_status: 'open' };
  const standing = [{ activity_id: ACT, rank: 1, title: 'A' }];
  function tables(voter, extra = {}) {
    return {
      trip_summary: ok(summary),
      trip_standing: ok(standing),
      trip_voters: ok([
        { activity_id: ACT, voter, display_name: 'Pat' },
        { activity_id: 'other', voter: 'someone-else', display_name: 'Sam' },
      ]),
      trip_members: ok([
        { voter, display_name: 'Pat', role: 'organizer' },
        { voter: 'someone-else', display_name: 'Sam', role: 'member' },
      ]),
      ...extra,
    };
  }
  test('returns the four views and computes me from the stored voter id', async () => {
    const voter = api.getVoterId();
    const c = use({ tables: tables(voter) });
    const t = await api.loadTrip(TRIP);
    expect(t.summary).toEqual(summary);
    expect(t.standing).toEqual(standing);
    expect(t.voters).toHaveLength(2);
    expect(t.members).toHaveLength(2);
    expect(t.me).toEqual({ isMember: true, name: 'Pat', role: 'organizer', votedActivityIds: [ACT] });
    expect(c.calls.from.map((q) => q.table).sort()).toEqual(['trip_members', 'trip_standing', 'trip_summary', 'trip_voters']);
    for (const q of c.calls.from) expect(q.filters).toEqual([['trip_id', TRIP]]);
  });
  test('a visitor who has not joined', async () => {
    use({ tables: tables('not-this-browser') });
    const t = await api.loadTrip(TRIP);
    expect(t.me).toEqual({ isMember: false, name: '', role: '', votedActivityIds: [] });
  });
  test('lowercase and padded codes are normalized', async () => {
    const c = use({ tables: tables(api.getVoterId()) });
    await api.loadTrip(`  ${TRIP.toLowerCase()} `);
    expect(c.calls.from[0].filters[0][1]).toBe(TRIP);
  });
  test('unknown trip returns null', async () => {
    use({ tables: { trip_summary: ok(null), trip_standing: ok([]), trip_voters: ok([]), trip_members: ok([]) } });
    expect(await api.loadTrip(TRIP)).toBeNull();
  });
  test('malformed codes return null without touching the database', async () => {
    const c = use();
    for (const bad of ['', null, undefined, 'short', 'ABCD234', 'ABCD23456', 'ABCDEFG0', 'ABCDEFGI', "AB'; drop", 'ABCD 234']) {
      expect(await api.loadTrip(bad)).toBeNull();
    }
    expect(c.calls.from).toHaveLength(0);
  });
  test('a failing view raises an ApiError', async () => {
    use({ tables: tables('v', { trip_standing: pgErr('boom', 'XX000') }) });
    await expect(api.loadTrip(TRIP)).rejects.toMatchObject({ name: 'ApiError', code: 'unknown' });
  });
  test('pages through many voter rows', async () => {
    const page1 = Array.from({ length: 1000 }, (_, i) => ({ activity_id: ACT, voter: `v${i}` }));
    const page2 = [{ activity_id: ACT, voter: 'last' }];
    const c = use({
      tables: tables('x', {
        trip_voters: (q) => ok(q.rangeArgs[0] === 0 ? page1 : page2),
      }),
    });
    const t = await api.loadTrip(TRIP);
    expect(t.voters).toHaveLength(1001);
    expect(c.calls.from.filter((q) => q.table === 'trip_voters')).toHaveLength(2);
  });
});

describe('actions', () => {
  test('joinTrip validates the name, calls join_trip, saves the name', async () => {
    const c = use({ rpc: { join_trip: ok() } });
    await api.joinTrip(TRIP, '  Pat   Jones ');
    expect(c.calls.rpc[0]).toEqual({ name: 'join_trip', args: { p_trip: TRIP, p_voter: api.getVoterId(), p_name: 'Pat Jones' } });
    expect(api.getSavedName()).toBe('Pat Jones');
  });
  test('joinTrip rejects a short name before calling the database', async () => {
    const c = use();
    await expect(api.joinTrip(TRIP, 'P')).rejects.toMatchObject({ code: 'invalid_input', message: 'Display name needs at least 2 characters.' });
    expect(c.calls.rpc).toHaveLength(0);
  });
  test('joinTrip with an unknown code', async () => {
    use({ rpc: { join_trip: pgErr('trip_not_found') } });
    await expect(api.joinTrip(TRIP, 'Pat')).rejects.toMatchObject({ code: 'trip_not_found' });
    await expect(api.joinTrip('bad', 'Pat')).rejects.toMatchObject({ code: 'trip_not_found' });
  });
  test('setVote on and off', async () => {
    const c = use({ rpc: { set_vote: ok() } });
    await api.setVote(TRIP, ACT, true);
    await api.setVote(TRIP, ACT, false);
    expect(c.calls.rpc.map((r) => r.args.p_on)).toEqual([true, false]);
    expect(c.calls.rpc[0].args).toEqual({ p_trip: TRIP, p_activity: ACT, p_voter: api.getVoterId(), p_on: true });
  });
  test('setVote after close says when voting closed', async () => {
    use({
      rpc: { set_vote: pgErr('voting_closed') },
      tables: { trip_summary: ok({ status: 'open', closed_at: null, voting_deadline: '2026-10-06T01:00:00Z' }) },
    });
    const e = await api.setVote(TRIP, ACT, true).catch((x) => x);
    expect(e.code).toBe('voting_closed');
    expect(e.message).toMatch(/^Voting closed at Oct \d+, 2026, \d+:\d{2} [AP]M \S+\. Your vote was not recorded\.$/);
  });
  test('setVote after an early close uses the close time', async () => {
    use({
      rpc: { set_vote: pgErr('voting_closed') },
      tables: { trip_summary: ok({ status: 'closed', closed_at: '2026-10-02T15:30:00Z', voting_deadline: '2026-10-06T01:00:00Z' }) },
    });
    const e = await api.setVote(TRIP, ACT, true).catch((x) => x);
    expect(e.message).toMatch(/Oct 2, 2026/);
  });
  test('setVote closed wording still works if the lookup fails', async () => {
    use({ rpc: { set_vote: pgErr('voting_closed') }, tables: { trip_summary: pgErr('x', 'XX000') } });
    const e = await api.setVote(TRIP, ACT, true).catch((x) => x);
    expect(e.message).toBe('Voting has closed. Your vote was not recorded.');
  });
  test('setVote errors: not a member, activity gone', async () => {
    use({ rpc: { set_vote: pgErr('not_a_member') } });
    await expect(api.setVote(TRIP, ACT, true)).rejects.toMatchObject({ code: 'not_a_member' });
    use({ rpc: { set_vote: pgErr('activity_not_found') } });
    await expect(api.setVote(TRIP, ACT, true)).rejects.toMatchObject({ code: 'activity_not_found' });
  });
  test('addActivity returns the id and sends clean values', async () => {
    const c = use({ rpc: { add_activity: ok(ACT) } });
    const id = await api.addActivity(TRIP, { title: ' Kayak ', description: '', sourceUrl: '' });
    expect(id).toBe(ACT);
    expect(c.calls.rpc[0].args).toEqual({ p_trip: TRIP, p: { title: 'Kayak', description: null, source_url: null } });
  });
  test('addActivity past 30 and after close', async () => {
    use({ rpc: { add_activity: pgErr('too_many_activities') } });
    await expect(api.addActivity(TRIP, { title: 'abc' })).rejects.toMatchObject({ code: 'too_many_activities' });
    use({ rpc: { add_activity: pgErr('voting_closed') }, tables: { trip_summary: ok({ status: 'closed', closed_at: '2026-10-02T15:30:00Z' }) } });
    const e = await api.addActivity(TRIP, { title: 'abc' }).catch((x) => x);
    expect(e.message).toMatch(/Your change was not saved\.$/);
  });
  test('updateActivity', async () => {
    const c = use({ rpc: { update_activity: ok() } });
    await api.updateActivity(ACT, { title: 'New', description: 'd', source_url: 'https://a.co' });
    expect(c.calls.rpc[0].args).toEqual({ p_activity: ACT, p: { title: 'New', description: 'd', source_url: 'https://a.co' } });
  });
  test('removeActivity returns the votes removed', async () => {
    use({ rpc: { remove_activity: ok(4) } });
    expect(await api.removeActivity(ACT)).toEqual({ votesRemoved: 4 });
    use({ rpc: { remove_activity: ok(null) } });
    expect(await api.removeActivity(ACT)).toEqual({ votesRemoved: 0 });
  });
  test('updateTrip maps field names and ignores unknown ones', async () => {
    const c = use({ rpc: { update_trip: ok() } });
    await api.updateTrip(TRIP, { itinerarySize: '5', name: ' New name ', votingDeadline: '2026-10-06T01:00:00Z', status: 'closed', created_by: 'x' });
    expect(c.calls.rpc[0].args).toEqual({ p_trip: TRIP, p: { itinerary_size: 5, name: 'New name', voting_deadline: '2026-10-06T01:00:00Z' } });
  });
  test('updateTrip invalid size', async () => {
    use({ rpc: { update_trip: pgErr('invalid_input: itinerary_size') } });
    await expect(api.updateTrip(TRIP, { itinerary_size: 99 })).rejects.toMatchObject({ code: 'invalid_input' });
  });
  test('setDefaultPick, closeTrip', async () => {
    const c = use({ rpc: { set_default_pick: ok(), close_trip: ok() } });
    await api.setDefaultPick(TRIP, ACT);
    await api.closeTrip(TRIP);
    expect(c.calls.rpc.map((r) => r.name)).toEqual(['set_default_pick', 'close_trip']);
    expect(c.calls.rpc[0].args).toEqual({ p_trip: TRIP, p_activity: ACT });
    expect(c.calls.rpc[1].args).toEqual({ p_trip: TRIP });
  });
  test('reopenTrip with and without a new deadline', async () => {
    const c = use({ rpc: { reopen_trip: ok() } });
    await api.reopenTrip(TRIP);
    await api.reopenTrip(TRIP, '2026-12-01T00:00:00Z');
    expect(c.calls.rpc[0].args).toEqual({ p_trip: TRIP, p_deadline: null });
    expect(c.calls.rpc[1].args.p_deadline).toBe('2026-12-01T00:00:00Z');
  });
  test('reopenTrip with a past deadline', async () => {
    use({ rpc: { reopen_trip: pgErr('deadline_passed') } });
    await expect(api.reopenTrip(TRIP, '2020-01-01T00:00:00Z')).rejects.toMatchObject({ code: 'deadline_passed' });
  });
  test('deleteTrip returns counts and sends the typed name as given', async () => {
    const c = use({ rpc: { delete_trip: ok({ activities: 6, votes: 14, members: 9 }) } });
    expect(await api.deleteTrip(TRIP, 'Cape Cod')).toEqual({ activities: 6, votes: 14, members: 9 });
    expect(c.calls.rpc[0].args).toEqual({ p_trip: TRIP, p_confirm_name: 'Cape Cod' });
  });
  test('deleteTrip with the wrong name', async () => {
    use({ rpc: { delete_trip: pgErr('name_mismatch') } });
    await expect(api.deleteTrip(TRIP, 'nope')).rejects.toMatchObject({ code: 'name_mismatch' });
  });
  test('every trip function rejects a malformed code without calling the database', async () => {
    const c = use();
    const calls = [
      () => api.joinTrip('x', 'Pat'), () => api.setVote('x', ACT, true), () => api.addActivity('x', { title: 'abc' }),
      () => api.updateTrip('x', {}), () => api.setDefaultPick('x', ACT), () => api.closeTrip('x'),
      () => api.reopenTrip('x'), () => api.deleteTrip('x', 'y'),
    ];
    for (const f of calls) await expect(f()).rejects.toMatchObject({ code: 'trip_not_found' });
    expect(c.calls.rpc).toHaveLength(0);
  });
});

describe('subscribe', () => {
  async function flush() { await vi.advanceTimersByTimeAsync(0); }

  test('listens to votes, activities, members, and trips for this trip', async () => {
    vi.useFakeTimers();
    const c = use();
    const stop = api.subscribe(TRIP, () => {}, { pollMs: 0 });
    await flush();
    expect(c.calls.channels).toHaveLength(1);
    const ls = c.calls.channels[0].listeners;
    const tables = new Set(ls.map((l) => l.filter.table));
    expect([...tables].sort()).toEqual(['activities', 'members', 'trips', 'votes']);
    for (const l of ls.filter((x) => x.filter.event !== 'DELETE')) {
      expect(l.type).toBe('postgres_changes');
      expect(l.filter.filter).toBe(l.filter.table === 'trips' ? `id=eq.${TRIP}` : `trip_id=eq.${TRIP}`);
    }
    // Deletes cannot be filtered by the service, so they are registered without a filter and checked here.
    expect(ls.filter((x) => x.filter.event === 'DELETE')).toHaveLength(4);
    stop();
  });

  test('changes fire onChange once for a burst, for this trip only', async () => {
    vi.useFakeTimers();
    const c = use();
    const onChange = vi.fn();
    const stop = api.subscribe(TRIP, onChange, { pollMs: 0, debounceMs: 50 });
    await flush();
    const handler = c.calls.channels[0].listeners[0].cb;
    handler({ table: 'votes', new: { trip_id: TRIP } });
    handler({ table: 'votes', new: { trip_id: TRIP } });
    handler({ table: 'votes', new: { trip_id: TRIP } });
    await vi.advanceTimersByTimeAsync(60);
    expect(onChange).toHaveBeenCalledTimes(1);
    handler({ table: 'votes', new: { trip_id: 'ZZZZ2222' } });
    await vi.advanceTimersByTimeAsync(60);
    expect(onChange).toHaveBeenCalledTimes(1);
    // A delete that only carries the row id still refreshes.
    handler({ table: 'votes', old: { id: 'abc' } });
    await vi.advanceTimersByTimeAsync(60);
    expect(onChange).toHaveBeenCalledTimes(2);
    // A delete carrying another trip is ignored.
    handler({ table: 'votes', old: { id: 'abc', trip_id: 'ZZZZ2222' } });
    await vi.advanceTimersByTimeAsync(60);
    expect(onChange).toHaveBeenCalledTimes(2);
    stop();
  });

  test('a trips event matches on its id', async () => {
    vi.useFakeTimers();
    const c = use();
    const onChange = vi.fn();
    const stop = api.subscribe(TRIP, onChange, { pollMs: 0, debounceMs: 10 });
    await flush();
    const handler = c.calls.channels[0].listeners[0].cb;
    handler({ table: 'trips', new: { id: 'ZZZZ2222' } });
    await vi.advanceTimersByTimeAsync(20);
    expect(onChange).not.toHaveBeenCalled();
    handler({ table: 'trips', new: { id: TRIP } });
    await vi.advanceTimersByTimeAsync(20);
    expect(onChange).toHaveBeenCalledTimes(1);
    stop();
  });

  test('reconnects with backoff after a channel error and refreshes once it is back', async () => {
    vi.useFakeTimers();
    const c = use();
    const onChange = vi.fn();
    const stop = api.subscribe(TRIP, onChange, { pollMs: 0, debounceMs: 10, backoffMs: [1000, 2000, 4000] });
    await flush();
    c.calls.channels[0].statusCb('SUBSCRIBED');
    await vi.advanceTimersByTimeAsync(50);
    expect(onChange).not.toHaveBeenCalled(); // first connection is not a refresh

    c.calls.channels[0].statusCb('CHANNEL_ERROR');
    await vi.advanceTimersByTimeAsync(999);
    expect(c.calls.channels).toHaveLength(1);
    await vi.advanceTimersByTimeAsync(2);
    expect(c.calls.channels).toHaveLength(2);
    expect(c.calls.removed).toContain(c.calls.channels[0]);

    // fails again: waits 2 seconds this time
    c.calls.channels[1].statusCb('TIMED_OUT');
    await vi.advanceTimersByTimeAsync(1999);
    expect(c.calls.channels).toHaveLength(2);
    await vi.advanceTimersByTimeAsync(2);
    expect(c.calls.channels).toHaveLength(3);

    c.calls.channels[2].statusCb('SUBSCRIBED');
    await vi.advanceTimersByTimeAsync(50);
    expect(onChange).toHaveBeenCalledTimes(1); // refresh after reconnect

    // and the backoff resets after success
    c.calls.channels[2].statusCb('CLOSED');
    await vi.advanceTimersByTimeAsync(1001);
    expect(c.calls.channels).toHaveLength(4);
    stop();
  });

  test('stale status callbacks from a replaced channel are ignored', async () => {
    vi.useFakeTimers();
    const c = use();
    const stop = api.subscribe(TRIP, () => {}, { pollMs: 0, backoffMs: [100] });
    await flush();
    const first = c.calls.channels[0];
    first.statusCb('CLOSED');
    await vi.advanceTimersByTimeAsync(150);
    expect(c.calls.channels).toHaveLength(2);
    first.statusCb('CHANNEL_ERROR'); // late noise from the old channel
    await vi.advanceTimersByTimeAsync(5000);
    expect(c.calls.channels).toHaveLength(2);
    stop();
  });

  test('unsubscribe removes the channel and stops everything', async () => {
    vi.useFakeTimers();
    const c = use();
    const onChange = vi.fn();
    const stop = api.subscribe(TRIP, onChange, { pollMs: 1000, debounceMs: 10 });
    await flush();
    const ch = c.calls.channels[0];
    stop();
    await flush();
    expect(c.calls.removed).toContain(ch);
    ch.statusCb && ch.statusCb('CLOSED');
    await vi.advanceTimersByTimeAsync(60000);
    expect(c.calls.channels).toHaveLength(1);
    expect(onChange).not.toHaveBeenCalled();
    stop(); // second call does nothing
  });

  test('unsubscribe before the client is ready creates no channel', async () => {
    vi.useFakeTimers();
    const c = use();
    const stop = api.subscribe(TRIP, () => {}, { pollMs: 0 });
    stop();
    await flush();
    expect(c.calls.channels).toHaveLength(0);
  });

  test('the safety poll fires while the page is visible', async () => {
    vi.useFakeTimers();
    use();
    const onChange = vi.fn();
    const stop = api.subscribe(TRIP, onChange, { pollMs: 1000, debounceMs: 10 });
    await vi.advanceTimersByTimeAsync(3100);
    expect(onChange).toHaveBeenCalledTimes(3);
    stop();
  });

  test('focus, visibility, and coming back online refresh; a dead feed is retried at once', async () => {
    vi.useFakeTimers();
    const listeners = {};
    const target = () => ({
      addEventListener: (t, f) => { (listeners[t] ||= new Set()).add(f); },
      removeEventListener: (t, f) => { listeners[t]?.delete(f); },
    });
    globalThis.window = target();
    globalThis.document = { ...target(), visibilityState: 'visible' };
    try {
      const c = use();
      const onChange = vi.fn();
      const stop = api.subscribe(TRIP, onChange, { pollMs: 0, debounceMs: 10, backoffMs: [60000] });
      await flush();
      c.calls.channels[0].statusCb('SUBSCRIBED');
      for (const ev of [['focus', window], ['visibilitychange', document], ['online', window]]) {
        onChange.mockClear();
        [...listeners[ev[0]]].forEach((f) => f());
        await vi.advanceTimersByTimeAsync(20);
        expect(onChange).toHaveBeenCalledTimes(1);
      }
      expect(c.calls.channels).toHaveLength(1); // feed is healthy, no new channel

      // feed drops with a long backoff pending: focus retries right away
      c.calls.channels[0].statusCb('CLOSED');
      expect(c.calls.channels).toHaveLength(1);
      // a retry timer is pending, so wake does not open a second one; it waits for the timer
      [...listeners.focus].forEach((f) => f());
      await vi.advanceTimersByTimeAsync(20);
      expect(c.calls.channels).toHaveLength(1);
      await vi.advanceTimersByTimeAsync(60000);
      expect(c.calls.channels).toHaveLength(2);

      // hidden tabs do not refresh
      document.visibilityState = 'hidden';
      onChange.mockClear();
      [...listeners.visibilitychange].forEach((f) => f());
      await vi.advanceTimersByTimeAsync(20);
      expect(onChange).not.toHaveBeenCalled();

      stop();
      expect(listeners.focus.size).toBe(0);
      expect(listeners.visibilitychange.size).toBe(0);
      expect(listeners.online.size).toBe(0);
    } finally {
      delete globalThis.window;
      delete globalThis.document;
    }
  });

  test('a throwing listener does not stop later notifications', async () => {
    vi.useFakeTimers();
    const c = use();
    let n = 0;
    const stop = api.subscribe(TRIP, () => { n += 1; throw new Error('bad listener'); }, { pollMs: 0, debounceMs: 10 });
    await flush();
    const h = c.calls.channels[0].listeners[0].cb;
    h({ table: 'votes', new: { trip_id: TRIP } });
    await vi.advanceTimersByTimeAsync(20);
    h({ table: 'votes', new: { trip_id: TRIP } });
    await vi.advanceTimersByTimeAsync(20);
    expect(n).toBe(2);
    stop();
  });

  test('a malformed trip code is rejected up front', () => {
    use();
    expect(() => api.subscribe('nope', () => {})).toThrow();
  });
});
