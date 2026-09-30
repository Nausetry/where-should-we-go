// A stand-in for the Supabase client, used by the api and state tests.
export function fakeClient({ rpc = {}, tables = {} } = {}) {
  const calls = { rpc: [], from: [], channels: [], removed: [] };
  const client = {
    calls,
    async rpc(name, args) {
      calls.rpc.push({ name, args });
      const h = rpc[name];
      if (!h) return { data: null, error: null };
      const out = typeof h === 'function' ? h(args) : h;
      return out && typeof out.then === 'function' ? out : out;
    },
    from(table) {
      const q = { table, filters: [], orders: [], rangeArgs: null, single: false };
      calls.from.push(q);
      const run = () => {
        const h = tables[table];
        const out = typeof h === 'function' ? h(q) : (h ?? { data: [], error: null });
        return Promise.resolve(out);
      };
      const b = {
        select() { return b; },
        eq(c, v) { q.filters.push([c, v]); return b; },
        order(c) { q.orders.push(c); return b; },
        range(a, z) { q.rangeArgs = [a, z]; return b; },
        maybeSingle() { q.single = true; return run(); },
        then(res, rej) { return run().then(res, rej); },
      };
      return b;
    },
    channel(name) {
      const ch = {
        name, listeners: [], statusCb: null,
        on(type, filter, cb) { ch.listeners.push({ type, filter, cb }); return ch; },
        subscribe(cb) { ch.statusCb = cb; return ch; },
      };
      calls.channels.push(ch);
      return ch;
    },
    async removeChannel(ch) { calls.removed.push(ch); },
  };
  return client;
}
