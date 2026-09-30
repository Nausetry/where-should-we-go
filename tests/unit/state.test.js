import { describe, test, expect, vi } from 'vitest';
import { createStore } from '../../js/state.js';
import * as defaultStore from '../../js/state.js';

function deferred() {
  let resolve, reject;
  const promise = new Promise((a, b) => { resolve = a; reject = b; });
  return { promise, resolve, reject };
}

function fakeApi(loads) {
  const api = {
    loadCalls: 0,
    subs: [],
    loadTrip: vi.fn(async (id) => {
      api.loadCalls += 1;
      const next = loads.shift();
      if (typeof next === 'function') return next(id);
      return next;
    }),
    subscribe: vi.fn((id, cb) => {
      const s = { id, cb, stopped: false };
      api.subs.push(s);
      return () => { s.stopped = true; };
    }),
  };
  return api;
}

const snap = (n) => ({ summary: { name: `Trip ${n}` }, standing: [], voters: [], members: [], me: {} });

describe('store', () => {
  test('starts idle', () => {
    const s = createStore({ api: fakeApi([]) });
    expect(s.getState()).toMatchObject({ status: 'idle', trip: null, stale: false, error: '' });
  });

  test('open loads the trip and notifies subscribers', async () => {
    const api = fakeApi([snap(1)]);
    const s = createStore({ api, now: () => '2026-10-01T00:00:00Z' });
    const seen = [];
    s.subscribeState((st) => seen.push(st.status));
    const h = s.open('ABCD2345');
    expect(s.getState().status).toBe('loading');
    await h.loaded;
    expect(s.getState()).toMatchObject({ status: 'ready', tripId: 'ABCD2345', loadedAt: '2026-10-01T00:00:00Z', stale: false });
    expect(s.getState().trip.summary.name).toBe('Trip 1');
    expect(seen).toEqual(['loading', 'ready']);
    expect(api.subscribe).toHaveBeenCalledWith('ABCD2345', expect.any(Function));
  });

  test('unknown trip', async () => {
    const s = createStore({ api: fakeApi([null]) });
    await s.open('ABCD2345').loaded;
    expect(s.getState()).toMatchObject({ status: 'notfound', trip: null });
  });

  test('first load failure shows an error with no trip', async () => {
    const s = createStore({ api: fakeApi([() => { throw new Error('Could not reach the server.'); }]) });
    await s.open('ABCD2345').loaded;
    expect(s.getState()).toMatchObject({ status: 'error', error: 'Could not reach the server.', trip: null });
  });

  test('a later failure keeps the last good trip and marks it stale, then recovers', async () => {
    const s = createStore({ api: fakeApi([snap(1), () => { throw new Error('offline'); }, snap(2)]) });
    await s.open('ABCD2345').loaded;
    await s.refresh();
    expect(s.getState()).toMatchObject({ status: 'ready', stale: true, error: 'offline' });
    expect(s.getState().trip.summary.name).toBe('Trip 1');
    await s.refresh();
    expect(s.getState()).toMatchObject({ status: 'ready', stale: false, error: '' });
    expect(s.getState().trip.summary.name).toBe('Trip 2');
  });

  test('the live feed triggers a refresh', async () => {
    const api = fakeApi([snap(1), snap(2)]);
    const s = createStore({ api });
    await s.open('ABCD2345').loaded;
    api.subs[0].cb();
    await vi.waitFor(() => expect(s.getState().trip.summary.name).toBe('Trip 2'));
  });

  test('overlapping refreshes collapse into one follow-up load', async () => {
    const d = deferred();
    const api = fakeApi([snap(1), () => d.promise, snap(3)]);
    const s = createStore({ api });
    await s.open('ABCD2345').loaded;
    const a = s.refresh();
    const b = s.refresh();
    const c = s.refresh();
    expect(api.loadCalls).toBe(2); // one initial, one running
    d.resolve(snap(2));
    await Promise.all([a, b, c]);
    expect(api.loadCalls).toBe(3); // exactly one follow-up for all three
    expect(s.getState().trip.summary.name).toBe('Trip 3');
  });

  test('a slow old response never overwrites a newer trip', async () => {
    const slow = deferred();
    const api = fakeApi([() => slow.promise, snap(2)]);
    const s = createStore({ api });
    const first = s.open('AAAAAAAA').loaded;
    const second = s.open('BBBBBBBB').loaded;
    await second;
    expect(s.getState()).toMatchObject({ tripId: 'BBBBBBBB', status: 'ready' });
    slow.resolve(snap(1));
    await first;
    expect(s.getState()).toMatchObject({ tripId: 'BBBBBBBB' });
    expect(s.getState().trip.summary.name).toBe('Trip 2');
    expect(api.subs[0].stopped).toBe(true);
  });

  test('stop ends the live feed and drops in-flight results', async () => {
    const d = deferred();
    const api = fakeApi([() => d.promise]);
    const s = createStore({ api });
    const h = s.open('ABCD2345');
    h.stop();
    expect(api.subs[0].stopped).toBe(true);
    d.resolve(snap(1));
    await h.loaded;
    expect(s.getState().status).toBe('loading');
  });

  test('refresh with nothing open does nothing', async () => {
    const api = fakeApi([]);
    const s = createStore({ api });
    await s.refresh();
    expect(api.loadTrip).not.toHaveBeenCalled();
  });

  test('run performs the action then refreshes, even when the action fails', async () => {
    const api = fakeApi([snap(1), snap(2), snap(3)]);
    const s = createStore({ api });
    await s.open('ABCD2345').loaded;
    const r = await s.run(async () => 'done');
    expect(r).toBe('done');
    expect(s.getState().trip.summary.name).toBe('Trip 2');
    await expect(s.run(async () => { throw new Error('voting closed'); })).rejects.toThrow('voting closed');
    expect(s.getState().trip.summary.name).toBe('Trip 3');
  });

  test('a listener that throws does not block others', async () => {
    const s = createStore({ api: fakeApi([snap(1)]) });
    const good = vi.fn();
    s.subscribeState(() => { throw new Error('bad'); });
    s.subscribeState(good);
    await s.open('ABCD2345').loaded;
    expect(good).toHaveBeenCalled();
  });

  test('unsubscribe stops notifications', async () => {
    const s = createStore({ api: fakeApi([snap(1)]) });
    const fn = vi.fn();
    const off = s.subscribeState(fn);
    off();
    await s.open('ABCD2345').loaded;
    expect(fn).not.toHaveBeenCalled();
  });

  test('reset returns to idle', async () => {
    const api = fakeApi([snap(1)]);
    const s = createStore({ api });
    await s.open('ABCD2345').loaded;
    s.reset();
    expect(s.getState()).toMatchObject({ status: 'idle', trip: null, tripId: '' });
    expect(api.subs[0].stopped).toBe(true);
  });
});

test('the default store is exported with the same functions', () => {
  for (const f of ['getState', 'subscribeState', 'refresh', 'openTrip', 'stopTrip', 'resetState', 'run']) {
    expect(typeof defaultStore[f]).toBe('function');
  }
  expect(defaultStore.getState().status).toBe('idle');
});
