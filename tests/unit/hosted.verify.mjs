// Live check of js/api.js against the hosted project. Not part of `npm test`.
// Run: set -a; source .env; set +a; node tests/unit/hosted.verify.mjs
// Creates trips named "ZZ-TEST api ..." and deletes them at the end.
import { createClient } from '@supabase/supabase-js';
import * as api from '../../js/api.js';
import { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } from '../../config.js';

const results = [];
const check = (name, cond, extra = '') => {
  results.push({ name, ok: !!cond });
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${name}${cond ? '' : '  ' + extra}`);
};
const expectErr = async (name, code, fn) => {
  try { await fn(); check(name, false, 'no error thrown'); }
  catch (e) { check(name, e instanceof api.ApiError && e.code === code, `got ${e.code}: ${e.message}`); return e; }
};

// Two "browsers": each has its own localStorage map and therefore its own voter id.
const stores = { A: new Map(), B: new Map() };
function as(who) {
  globalThis.localStorage = {
    getItem: (k) => (stores[who].has(k) ? stores[who].get(k) : null),
    setItem: (k, v) => { stores[who].set(k, String(v)); },
  };
  api._resetIdentity();
}

const client = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, { auth: { persistSession: false } });
api._setClient(client);

async function waitForViews() {
  const deadline = Date.now() + 15 * 60 * 1000;
  while (Date.now() < deadline) {
    const { error } = await client.from('trip_summary').select('trip_id').limit(1);
    if (!error) return true;
    await new Promise((r) => setTimeout(r, 15000));
  }
  return false;
}

const created = [];
const waitFor = async (pred, ms = 4000) => {
  const t0 = Date.now();
  while (Date.now() - t0 < ms) { if (pred()) return Date.now() - t0; await new Promise((r) => setTimeout(r, 25)); }
  return -1;
};

try {
  if (!(await waitForViews())) throw new Error('hosted views never appeared');
  const future = new Date(Date.now() + 86400000).toISOString();
  const input = {
    name: `ZZ-TEST api ${Date.now()}`, destination: 'Provincetown, MA',
    start_date: '2026-10-10', end_date: '2026-10-14', voting_deadline: future, itinerary_size: 2,
    organizer_name: 'Pat Jones',
    activities: [
      { title: 'Whale watching cruise', description: 'Three hours', source_url: 'https://example.com/cruise' },
      { title: 'Beach day' },
      { title: 'Lobster dinner' },
    ],
  };

  as('A');
  const { id } = await api.createTrip(input);
  created.push({ id, name: input.name });
  check('create trip returns an 8 character id', /^[A-Z2-9]{8}$/.test(id), id);

  let t = await api.loadTrip(id);
  check('load: summary matches', t && t.summary.name === input.name && t.summary.effective_status === 'open' && t.summary.day_count === 5);
  check('load: three activities ranked', t.standing.length === 3 && t.standing[0].rank === 1);
  check('load: creator is an organizer member', t.me.isMember && t.me.role === 'organizer' && t.me.name === 'Pat Jones');
  check('load: default pick is the first activity added', t.standing.find((s) => s.is_default_pick).title === 'Whale watching cruise');
  check('load: null description stored', t.standing.find((s) => s.title === 'Beach day').description === null);
  check('load: lowercase code works', (await api.loadTrip(id.toLowerCase())) !== null);
  check('load: unknown code returns null', (await api.loadTrip('ZZZZZZZZ')) === null);
  check('load: malformed code returns null', (await api.loadTrip('nope')) === null);

  const [a1, a2, a3] = t.standing.slice().sort((x, y) => x.seq - y.seq).map((s) => s.activity_id);

  // A second person
  as('B');
  let tb = await api.loadTrip(id);
  check('second browser is not a member yet', tb.me.isMember === false);
  await expectErr('vote before joining is refused', 'not_a_member', () => api.setVote(id, a2, true));
  await expectErr('join with a one character name is refused', 'invalid_input', () => api.joinTrip(id, 'S'));
  await expectErr('join an unknown trip', 'trip_not_found', () => api.joinTrip('ZZZZZZZZ', 'Sam'));
  await api.joinTrip(id, '  Sam   Lee ');
  tb = await api.loadTrip(id);
  check('join: member with cleaned name', tb.me.isMember && tb.me.name === 'Sam Lee' && tb.me.role === 'member');
  check('join: name remembered in this browser', api.getSavedName() === 'Sam Lee');

  // Live updates: A listens, B votes and withdraws
  as('A');
  let fires = 0;
  const stop = api.subscribe(id, () => { fires += 1; });
  await new Promise((r) => setTimeout(r, 2500)); // let the channel join
  as('B');
  const t0 = Date.now();
  await api.setVote(id, a2, true);
  const dIns = await waitFor(() => fires >= 1);
  console.log(`      vote event seen after ${dIns} ms`);
  check('live: a vote reaches the other page within 2 seconds', dIns >= 0 && dIns + (Date.now() - t0 - dIns) < 2000, `${dIns} ms`);
  const before = fires;
  const t1 = Date.now();
  await api.setVote(id, a2, false);
  const dDel = await waitFor(() => fires > before);
  console.log(`      withdraw event seen after ${dDel} ms`);
  check('live: a withdrawn vote reaches the other page within 2 seconds', dDel >= 0 && Date.now() - t1 < 2000, `${dDel} ms`);
  const before2 = fires;
  await api.setVote(id, a2, true);
  await waitFor(() => fires > before2);
  stop();

  tb = await api.loadTrip(id);
  check('vote recorded and shown in me', tb.me.votedActivityIds.length === 1 && tb.me.votedActivityIds[0] === a2);
  check('standing shows 1 cast vote', tb.standing.find((s) => s.activity_id === a2).cast_votes === 1);
  check('voters list names the voter', tb.voters.some((v) => v.activity_id === a2 && v.display_name === 'Sam Lee'));
  check('member list shows has_voted', tb.members.find((m) => m.display_name === 'Sam Lee').has_voted === true);
  check('summary counts', tb.summary.member_count === 2 && tb.summary.voted_count === 1 && tb.summary.not_voted_count === 1);
  await api.setVote(id, a2, true); // idempotent
  await api.setVote(id, a1, true);
  await api.setVote(id, a1, false);
  tb = await api.loadTrip(id);
  check('repeat vote is harmless', tb.me.votedActivityIds.length === 1);
  await expectErr('vote for an unknown activity', 'activity_not_found', () => api.setVote(id, '00000000-0000-0000-0000-000000000000', true));

  // Edits
  as('A');
  const newAct = await api.addActivity(id, { title: 'Dune tour', description: '', source_url: '' });
  check('add activity returns an id', /^[0-9a-f-]{36}$/.test(newAct));
  await api.updateActivity(newAct, { title: 'Dune tour at sunset', description: 'Two hours', source_url: 'https://example.com/dunes' });
  t = await api.loadTrip(id);
  const dune = t.standing.find((s) => s.activity_id === newAct);
  check('update activity stored', dune.title === 'Dune tour at sunset' && dune.description === 'Two hours' && dune.source_url === 'https://example.com/dunes');
  await expectErr('bad web address is refused', 'invalid_input', () => api.updateActivity(newAct, { title: 'Dune tour', source_url: 'example.com' }));
  await api.setDefaultPick(id, a3);
  t = await api.loadTrip(id);
  check('default pick changed', t.standing.find((s) => s.is_default_pick).activity_id === a3 && t.summary.default_activity_id === a3);
  await api.updateTrip(id, { itinerarySize: 3 });
  t = await api.loadTrip(id);
  check('itinerary size updated', t.summary.itinerary_size === 3);
  await expectErr('itinerary size 31 refused', 'invalid_input', () => api.updateTrip(id, { itinerary_size: 31 }));
  const r = await api.removeActivity(a2);
  check('remove activity reports the votes removed', r.votesRemoved === 1, JSON.stringify(r));
  t = await api.loadTrip(id);
  check('removed activity gone', !t.standing.some((s) => s.activity_id === a2) && t.standing.length === 3);

  // Close and closed-voting wording
  await api.closeTrip(id);
  t = await api.loadTrip(id);
  check('closed: effective status closed', t.summary.effective_status === 'closed' && t.summary.closed_at);
  check('closed: default votes counted for non-voters', t.summary.default_votes_total >= 1);
  as('B');
  const ce = await expectErr('vote after close is refused', 'voting_closed', () => api.setVote(id, a1, true));
  check('closed wording names the time', ce && /^Voting closed at .*\d{4}, .*\. Your vote was not recorded\.$/.test(ce.message), ce && ce.message);
  console.log(`      ${ce && ce.message}`);
  await expectErr('add activity after close refused', 'voting_closed', () => api.addActivity(id, { title: 'Late idea' }));
  await api.reopenTrip(id);
  t = await api.loadTrip(id);
  check('reopened', t.summary.effective_status === 'open' && t.summary.closed_at === null);
  await expectErr('reopen with a past deadline refused when needed is tested in DB suite', 'deadline_passed', () => api.updateTrip(id, { votingDeadline: '2020-01-01T00:00:00Z' }));

  // Errors on create
  await expectErr('create with past deadline', 'deadline_passed', () => api.createTrip({ ...input, name: 'ZZ-TEST api past', voting_deadline: '2020-01-01T00:00:00Z' }));
  const bad = await expectErr('create with a short title names the field', 'invalid_input', () => api.createTrip({ ...input, name: 'ZZ-TEST api bad', activities: [{ title: 'ab' }, { title: 'Beach day' }, { title: 'Lobster dinner' }] }));
  check('invalid_input detail is the field path', bad && bad.detail === 'activities[0].title', bad && bad.detail);
  await expectErr('create with two activities', 'invalid_input', () => api.createTrip({ ...input, name: 'ZZ-TEST api two', activities: input.activities.slice(0, 2) }));
  await expectErr('create with end before start', 'invalid_input', () => api.createTrip({ ...input, name: 'ZZ-TEST api dates', end_date: '2026-10-01' }));
  const sweep = await client.from('trip_summary').select('trip_id').like('name', 'ZZ-TEST api %');
  check('failed creates left no trips behind', sweep.data.length === 1, JSON.stringify(sweep.data));

  // Delete
  as('A');
  await expectErr('delete with the wrong name', 'name_mismatch', () => api.deleteTrip(id, 'wrong'));
  const d = await api.deleteTrip(id, input.name);
  created.pop();
  check('delete reports counts', d.activities === 3 && d.members === 2 && typeof d.votes === 'number', JSON.stringify(d));
  check('deleted trip loads as not found', (await api.loadTrip(id)) === null);
} catch (e) {
  check('script ran to the end', false, e && e.message);
} finally {
  as('A');
  for (const c of created) {
    try { await api.deleteTrip(c.id, c.name); console.log(`cleaned up ${c.id}`); } catch (e) { console.log(`cleanup failed for ${c.id}: ${e.message}`); }
  }
  const failed = results.filter((r) => !r.ok).length;
  console.log(`\n${results.length - failed} passed, ${failed} failed`);
  process.exit(failed ? 1 : 0);
}
