// A small store for the trip screen. Views read the snapshot and subscribe to changes.
// The store loads through js/api.js, refreshes when the live feed fires, and keeps
// the last good snapshot on screen if a refresh fails.
import * as realApi from './api.js';

/**
 * status: 'idle' | 'loading' | 'ready' | 'notfound' | 'error'
 * trip:   { summary, standing, voters, members, me } or null
 * stale:  true when the last refresh failed and `trip` is older than the screen implies
 * error:  plain-wording message for the last failed load, or ''
 * loadedAt: ISO time of the last successful load, or ''
 */
function initial() {
  return { tripId: '', status: 'idle', trip: null, stale: false, error: '', loadedAt: '' };
}

export function createStore(deps = {}) {
  const api = deps.api || realApi;
  const now = deps.now || (() => new Date().toISOString());
  let state = initial();
  const listeners = new Set();
  let stopFeed = null;
  let seq = 0;          // latest request number; older responses are dropped
  let inFlight = null;  // promise of the running load
  let again = false;    // another refresh was asked for while one was running

  function emit() {
    for (const fn of [...listeners]) {
      try { fn(state); } catch { /* one bad listener must not stop the others */ }
    }
  }

  function set(patch) {
    state = { ...state, ...patch };
    emit();
  }

  function getState() {
    return state;
  }

  function subscribeState(fn) {
    listeners.add(fn);
    return () => listeners.delete(fn);
  }

  async function runLoad(id, mine) {
    try {
      const trip = await api.loadTrip(id);
      if (mine !== seq || id !== state.tripId) return;
      if (trip === null) {
        set({ status: 'notfound', trip: null, stale: false, error: '' });
      } else {
        set({ status: 'ready', trip, stale: false, error: '', loadedAt: now() });
      }
    } catch (e) {
      if (mine !== seq || id !== state.tripId) return;
      const message = (e && e.message) || 'Could not load the trip. Try again.';
      // Keep showing the last good numbers, marked as out of date.
      if (state.trip) set({ stale: true, error: message });
      else set({ status: 'error', stale: false, error: message });
    }
  }

  /** Reload the current trip now. Overlapping calls collapse into one follow-up load. */
  function refresh() {
    const id = state.tripId;
    if (!id) return Promise.resolve(state);
    if (inFlight) {
      again = true;
      return inFlight;
    }
    const mine = ++seq;
    const token = {};
    const p = (async () => {
      try {
        await runLoad(id, mine);
        while (again && id === state.tripId) {
          again = false;
          await runLoad(id, ++seq);
        }
      } finally {
        if (inFlight && inFlight.token === token) {
          inFlight = null;
          again = false;
        }
      }
      return state;
    })();
    p.token = token;
    inFlight = p;
    return p;
  }

  /** Start showing a trip: load it, watch for changes, return a stop function. */
  function open(id) {
    stop();
    state = { ...initial(), tripId: id, status: 'loading' };
    emit();
    const first = refresh();
    stopFeed = api.subscribe(id, () => { refresh(); });
    return { stop, loaded: first };
  }

  function stop() {
    if (stopFeed) {
      try { stopFeed(); } catch { /* already stopped */ }
      stopFeed = null;
    }
    seq += 1; // drop anything still in flight
    inFlight = null;
    again = false;
  }

  function reset() {
    stop();
    state = initial();
    emit();
  }

  /** Run a change (vote, edit, close) and then reload, so the screen shows stored values. */
  async function run(action) {
    try {
      return await action();
    } finally {
      await refresh();
    }
  }

  return { getState, subscribeState, refresh, open, stop, reset, run };
}

const store = createStore();
export const getState = store.getState;
export const subscribeState = store.subscribeState;
export const refresh = store.refresh;
export const openTrip = store.open;
export const stopTrip = store.stop;
export const resetState = store.reset;
export const run = store.run;
