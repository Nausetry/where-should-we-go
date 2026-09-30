// Trip screen: header, rule, join, activities and standing, confirmed itinerary,
// members, and organizer actions. Every value comes from loadTrip.
import * as api from '../api.js';
import { validateField } from '../validate.js';
import { formatRange, formatDeadline, formatAsOf, plural } from '../format.js';
import {
  h, setKids, makeField, makeMessage, guarded, focusAndShow, keepFocus, confirmAction,
  showNotice, hideNotice, setTitle, domainOf,
} from '../ui.js';

const MAX_ACTIVITIES = 30;

export function mountTrip(root, tripId) {
  const S = {
    data: null,
    who: new Set(),
    editNodes: new Map(),
    inflight: false,
    queued: false,
    timer: null,
    unsub: null,
    gone: false,
    built: false,
    joinMode: '',
    orgMode: '',
    lastKey: '',
  };

  const loading = h('p', { class: 'status-text', testid: 'loading-text', role: 'status', text: 'Loading trip. One moment.' });
  setKids(root, loading);
  setTitle('Loading trip | Where Should We Go?');

  // Containers, created once.
  const headerEl = h('header', { class: 'masthead' });
  const msg = makeMessage('message');
  const joinEl = h('section', { class: 'join' });
  const ruleEl = h('section', {});
  const confirmedEl = h('section', { class: 'confirmed' });
  const standingEl = h('section', { class: 'standing' });
  const membersEl = h('section', {});
  const organizerEl = h('section', { class: 'organizer' });
  const asofEl = h('p', { class: 'muted', testid: 'standing-asof' });
  const sourceEl = h('p', { class: 'muted', testid: 'standing-source' });
  const sizeNoteEl = h('p', { testid: 'size-note', hidden: true });
  const listEl = h('ul', { class: 'activities', testid: 'activity-list' });
  const standingHead = h('h2');
  setKids(standingEl, standingHead, asofEl, sourceEl, sizeNoteEl, msg.el, listEl);

  let joinField = null;
  let sizeField = null;
  let sizeHint = null;

  // ----- data ------------------------------------------------------------

  async function refresh() {
    if (S.gone) return;
    if (S.inflight) {
      S.queued = true;
      return;
    }
    S.inflight = true;
    try {
      const data = await api.loadTrip(tripId);
      if (S.gone) return;
      if (!data) {
        showNotFound();
        return;
      }
      hideNotice();
      render(data);
    } catch (err) {
      if (S.gone) return;
      if (!S.data) showLoadError(err);
      else showNotice('Live updates are paused. Reconnecting now. Counts refresh on their own when the connection returns.');
    } finally {
      S.inflight = false;
      if (S.queued && !S.gone) {
        S.queued = false;
        refresh();
      }
    }
  }

  function showNotFound() {
    S.gone = true;
    cleanup();
    setTitle('Trip not found | Where Should We Go?');
    setKids(
      root,
      h('header', { class: 'masthead' }, h('h1', { text: 'Trip not found' })),
      h('p', { testid: 'not-found', text: 'No trip found for this link. Check the code and try again.' }),
      h('div', { class: 'actions' }, h('a', { class: 'button', href: location.pathname, text: 'Plan a new trip' })),
    );
  }

  function showLoadError() {
    const retry = h('button', { type: 'button', testid: 'retry', text: 'Try again' });
    retry.addEventListener('click', () => {
      setKids(root, loading);
      refresh();
    });
    setKids(
      root,
      h('header', { class: 'masthead' }, h('h1', { text: 'Trip could not be loaded' })),
      h('p', { testid: 'load-error', role: 'alert', text: 'We could not load this trip. Check your connection, then press Try again.' }),
      h('div', { class: 'actions' }, retry),
    );
  }

  // ----- render ----------------------------------------------------------

  function build() {
    setKids(root, headerEl, joinEl, ruleEl, confirmedEl, standingEl, membersEl, organizerEl);
    S.built = true;
  }

  function render(data) {
    S.data = data;
    if (headerEl.parentNode !== root) build();
    const s = data.summary;
    const closed = s.effective_status === 'closed';
    if (closed) S.editNodes.clear();
    setTitle(`${s.name}, ${s.destination} | Where Should We Go?`);
    renderHeader(data, closed);
    renderJoin(data, closed);
    renderRule(data, closed);
    renderConfirmed(data, closed);
    renderStanding(data, closed);
    renderMembers(data);
    renderOrganizer(data, closed);
    scheduleDeadline(s, closed);
  }

  function renderHeader(data, closed) {
    const s = data.summary;
    const facts = [
      ['Destination', h('dd', { testid: 'trip-destination', text: s.destination })],
      ['Dates', h('dd', { testid: 'trip-dates', text: formatRange(s.start_date, s.end_date) })],
      [
        'Voting deadline',
        h('dd', { testid: 'trip-deadline', class: closed ? '' : 'accent', text: formatDeadline(s.voting_deadline) }),
      ],
      ['Status', h('dd', { testid: 'trip-status', text: closed ? 'Voting closed' : 'Voting open' })],
      ['Itinerary size', h('dd', { testid: 'trip-itinerary-size', text: plural(s.itinerary_size, 'activity', 'activities') })],
      [
        'Members',
        h('dd', {
          testid: 'trip-members',
          text: `${plural(s.member_count, 'member', 'members')}, ${s.voted_count} of ${s.member_count} have voted`,
        }),
      ],
    ];
    if (closed && s.closed_at) facts.push(['Closed', h('dd', { testid: 'trip-closed-at', text: formatAsOf(s.closed_at) })]);
    setKids(
      headerEl,
      h('h1', { testid: 'trip-title', text: s.name }),
      h('dl', { class: 'facts' }, facts.map(([k, dd]) => h('div', { class: 'fact' }, h('dt', { text: k }), dd))),
      h('p', {
        class: 'caveat',
        testid: 'caveat-text',
        text: 'Anyone with this link can vote, edit, and delete this trip. Each browser remembers only its own votes. Do not use this page for sensitive plans.',
      }),
    );
  }

  function renderJoin(data, closed) {
    const me = data.me;
    if (me.isMember) {
      S.joinMode = 'me';
      joinField = null;
      setKids(
        joinEl,
        h(
          'p',
          { class: 'me-line' },
          closed ? 'Listed as ' : 'Voting as ',
          h('span', { class: 'strong', testid: 'me-name', tabindex: '-1', text: me.name }),
          closed ? null : `, ${plural(me.votedActivityIds.length, 'vote', 'votes')} cast`,
        ),
      );
      return;
    }
    if (closed) {
      S.joinMode = 'none';
      joinField = null;
      setKids(joinEl);
      return;
    }
    if (S.joinMode === 'join') return;
    S.joinMode = 'join';
    joinField = makeField({
      testid: 'join-name',
      errorId: 'join-name',
      label: 'Your name',
      hint: 'Shown beside your votes. Example: Pat Jones',
      value: api.getSavedName(),
      autocomplete: 'name',
    });
    const submit = h('button', { type: 'submit', class: 'primary', testid: 'join-submit', text: 'Save name and continue' });
    const form = h('form', { novalidate: true }, h('h2', { text: 'Enter your name to vote' }), joinField.root, h('div', { class: 'actions' }, submit));
    form.addEventListener('submit', (ev) => {
      ev.preventDefault();
      doJoin();
    });
    joinField.input.addEventListener('input', () => {
      if (joinField.error) joinField.setError('');
    });
    setKids(joinEl, form);
  }

  let joining = null;
  async function doJoin() {
    if (joining) return joining;
    const r = validateField('displayName', joinField.value);
    if (!r.ok) {
      joinField.setError(r.error);
      joinField.input.focus();
      return false;
    }
    joinField.setError('');
    joining = (async () => {
      try {
        await api.joinTrip(tripId, r.value);
        api.saveName(r.value);
        S.joinMode = '';
        await refresh();
        const me = root.querySelector('[data-testid="me-name"]');
        if (me) me.focus();
        return true;
      } catch (err) {
        joinField.setError(err.message || 'Your name was not saved. Try again.');
        return false;
      } finally {
        joining = null;
      }
    })();
    return joining;
  }

  function renderRule(data, closed) {
    const s = data.summary;
    const def = data.standing.find((r) => r.is_default_pick);
    const parts = [
      'Each member may vote for any number of activities, one vote per activity.',
      `The top ${plural(s.itinerary_size, 'activity', 'activities')} by total votes form the itinerary.`,
      `When voting closes, each member who cast no votes counts as one vote for the default pick${def ? `, currently "${def.title}"` : ''}. These are called default votes and are shown apart from cast votes.`,
      'Ties go to the default pick first, then to the activity added earliest.',
    ];
    const kids = [h('h2', { text: 'How the itinerary is decided' }), h('p', { testid: 'rule-text', text: parts.join(' ') })];
    if (!closed) {
      kids.push(
        h('p', {
          testid: 'not-voted-note',
          text: `${s.not_voted_count} of ${s.member_count} members have not voted. The default pick counts once for each at close.`,
        }),
      );
    }
    setKids(ruleEl, kids);
  }

  function renderConfirmed(data, closed) {
    const s = data.summary;
    if (!closed) {
      setKids(confirmedEl);
      confirmedEl.hidden = true;
      return;
    }
    confirmedEl.hidden = false;
    const when = s.closed_at || s.voting_deadline;
    const rows = data.standing.filter((r) => r.in_itinerary).sort((a, b) => a.rank - b.rank || a.seq - b.seq);
    const notes = [];
    if (s.cast_votes_total === 0) notes.push('No votes were cast. Itinerary set by default rules.');
    if (s.tie_broken) notes.push('A tie at the last itinerary place was broken: the default pick first, then the activity added earliest.');
    if (s.activity_count < s.itinerary_size) {
      notes.push(`Itinerary has ${plural(s.activity_count, 'activity', 'activities')}. Size was set to ${s.itinerary_size}.`);
    }
    const num = (n) => h('td', { class: 'num', text: String(n) });
    const table = h(
      'table',
      { testid: 'itinerary-table' },
      h('caption', { text: `Confirmed itinerary, ${plural(rows.length, 'activity', 'activities')}` }),
      h(
        'thead',
        {},
        h(
          'tr',
          {},
          h('th', { scope: 'col', class: 'rankcol', text: 'Rank' }),
          h('th', { scope: 'col', text: 'Activity' }),
          h('th', { scope: 'col', class: 'num', text: 'Cast votes' }),
          h('th', { scope: 'col', class: 'num', text: 'Default votes' }),
          h('th', { scope: 'col', class: 'num', text: 'Total' }),
        ),
      ),
      h(
        'tbody',
        {},
        rows.map((r) =>
          h('tr', { testid: `itinerary-row-${r.activity_id}` }, h('td', { class: 'rankcol', text: String(r.rank) }), h('td', { text: r.title }), num(r.cast_votes), num(r.default_votes), num(r.total_votes)),
        ),
      ),
    );
    setKids(
      confirmedEl,
      h('h2', { text: 'Confirmed itinerary' }),
      h('p', { class: 'accent', testid: 'confirmed-statement', text: `Itinerary confirmed on ${formatAsOf(when)}` }),
      h('p', {
        testid: 'basis-line',
        text: `${plural(s.member_count, 'member', 'members')}, ${plural(s.cast_votes_total, 'cast vote', 'cast votes')}, ${plural(s.default_votes_total, 'default vote', 'default votes')}`,
      }),
      notes.map((t) => h('p', { class: 'basis-note', text: t })),
      table,
      h('p', { class: 'muted', text: `Source: votes recorded for this trip, counted by the rule above, as of ${formatAsOf(s.as_of)}.` }),
    );
  }

  // ----- activities ------------------------------------------------------

  function renderStanding(data, closed) {
    const s = data.summary;
    standingHead.textContent = closed ? 'All activities and votes' : 'Activities and current standing';
    asofEl.textContent = `Standing as of ${formatAsOf(s.as_of)}`;
    sourceEl.textContent = 'Source: votes recorded for this trip, counted by the rule above. Each count opens a list of who voted and when.';
    if (s.activity_count < s.itinerary_size) {
      sizeNoteEl.textContent = `Itinerary has ${plural(s.activity_count, 'activity', 'activities')}. Size was set to ${s.itinerary_size}.`;
      sizeNoteEl.hidden = false;
    } else {
      sizeNoteEl.hidden = true;
    }
    const restore = keepFocus(standingEl);
    const rows = [...data.standing].sort((a, b) => a.rank - b.rank || a.seq - b.seq);
    const votersBy = new Map();
    for (const v of data.voters) {
      if (!votersBy.has(v.activity_id)) votersBy.set(v.activity_id, []);
      votersBy.get(v.activity_id).push(v);
    }
    const live = new Set(rows.map((r) => r.activity_id));
    for (const id of [...S.editNodes.keys()]) if (!live.has(id)) S.editNodes.delete(id);
    for (const id of [...S.who]) if (!live.has(id)) S.who.delete(id);
    const items = [];
    let cutoffAdded = false;
    rows.forEach((r, i) => {
      items.push(S.editNodes.get(r.activity_id) || buildActivity(r, data, closed, votersBy.get(r.activity_id) || []));
      const next = rows[i + 1];
      if (!cutoffAdded && r.in_itinerary && next && !next.in_itinerary) {
        cutoffAdded = true;
        items.push(
          h('li', { class: 'cutoff', testid: 'itinerary-cutoff', text: `Itinerary cutoff: the top ${plural(s.itinerary_size, 'activity', 'activities')} are above this line.` }),
        );
      }
    });
    if (!rows.length) items.push(h('li', { testid: 'no-activities', text: 'No activities yet. Add the first one below.' }));
    setKids(listEl, items);
    restore();
  }

  function buildActivity(r, data, closed, voters) {
    const id = r.activity_id;
    const me = data.me;
    const voted = me.votedActivityIds.includes(id);
    const whoOpen = S.who.has(id);
    const voteErr = h('p', { class: 'error', testid: `vote-error-${id}`, role: 'alert', hidden: true });

    const voteBtn = h('button', {
      type: 'button',
      testid: `vote-${id}`,
      'aria-pressed': voted ? 'true' : 'false',
      disabled: closed,
      text: voted ? 'Withdraw vote' : 'Vote',
    });
    guarded(voteBtn, async () => {
      voteErr.hidden = true;
      try {
        if (!S.data.me.isMember) {
          if (!joinField) throw new Error('Enter your name first.');
          const ok = await doJoin();
          if (!ok) return;
        }
        const now = S.data.me.votedActivityIds.includes(id);
        await api.setVote(tripId, id, !now);
        await refresh();
      } catch (err) {
        voteErr.textContent = err.message || 'Your vote was not recorded. Try again.';
        voteErr.hidden = false;
        if (err.code === 'voting_closed') refresh();
      }
    });

    const whoBtn = h('button', {
      type: 'button',
      testid: `who-${id}`,
      'aria-expanded': whoOpen ? 'true' : 'false',
      'aria-controls': `voters-${id}`,
      text: whoOpen ? 'Hide who voted' : 'Show who voted',
    });
    whoBtn.addEventListener('click', () => {
      if (S.who.has(id)) S.who.delete(id);
      else S.who.add(id);
      const open = S.who.has(id);
      whoBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
      whoBtn.textContent = open ? 'Hide who voted' : 'Show who voted';
      votersEl.hidden = !open;
    });

    const votersEl = h(
      'div',
      { id: `voters-${id}`, class: 'voters', testid: `voters-${id}`, hidden: !whoOpen },
      voters.length
        ? h(
            'ul',
            { class: 'plain' },
            [...voters]
              .sort((a, b) => String(a.voted_at).localeCompare(String(b.voted_at)))
              .map((v) => h('li', { text: `${v.display_name}, ${formatAsOf(v.voted_at)}` })),
          )
        : h('p', { text: 'No votes cast.' }),
      r.default_votes > 0
        ? h('p', { class: 'muted', text: `Plus ${plural(r.default_votes, 'default vote', 'default votes')} from members who cast no votes.` })
        : null,
    );

    const actions = [voteBtn, whoBtn];
    if (!closed) {
      actions.push(h('button', { type: 'button', testid: `edit-${id}`, text: 'Edit', onClick: () => startEdit(r) }));
      actions.push(h('button', { type: 'button', testid: `remove-${id}`, text: 'Remove', onClick: () => removeActivity(r) }));
      if (!r.is_default_pick) {
        actions.push(h('button', { type: 'button', testid: `set-default-${id}`, text: 'Make default pick', onClick: () => setDefault(r) }));
      }
    }

    const showBreakdown = closed || r.default_votes > 0;
    return h(
      'li',
      { class: 'activity', testid: `activity-${id}` },
      h(
        'div',
        { class: 'act-head' },
        h('span', { class: 'rank', text: `${r.rank}.` }),
        h('h3', { testid: `activity-title-${id}`, text: r.title }),
        r.is_default_pick ? h('span', { class: 'flag', testid: `default-badge-${id}`, text: 'Default pick' }) : null,
      ),
      r.description ? h('p', { class: 'desc', testid: `activity-description-${id}`, text: r.description }) : null,
      r.source_url
        ? h('p', { class: 'source' }, h('a', { testid: `activity-source-${id}`, href: r.source_url, target: '_blank', rel: 'noopener noreferrer', text: domainOf(r.source_url) }))
        : null,
      h(
        'p',
        { class: 'votes' },
        h('span', { class: 'strong', testid: `votecount-${id}`, text: plural(r.total_votes, 'vote', 'votes') }),
        showBreakdown ? h('span', { class: 'muted', text: `, ${r.cast_votes} cast, ${r.default_votes} default` }) : null,
      ),
      h('div', { class: 'actions' }, actions),
      voteErr,
      votersEl,
    );
  }

  // ----- activity actions ------------------------------------------------

  async function afterChange(text, kind) {
    await refresh();
    if (text) msg.show(text, kind || 'status');
  }

  function fail(err, fallback) {
    msg.show((err && err.message) || fallback, 'alert');
    if (err && err.code === 'voting_closed') refresh();
  }

  async function removeActivity(r) {
    msg.clear();
    const wasDefault = r.is_default_pick;
    const run = async () => {
      const out = await api.removeActivity(r.activity_id);
      S.editNodes.delete(r.activity_id);
      const votes = out && typeof out.votesRemoved === 'number' ? out.votesRemoved : r.cast_votes;
      await refresh();
      let text = `Removed "${r.title}". ${plural(votes, 'vote', 'votes')} deleted.`;
      if (wasDefault && S.data) {
        const def = S.data.standing.find((x) => x.is_default_pick);
        if (def) text += ` The default pick was removed. "${def.title}" is now the default pick.`;
      }
      msg.show(text);
    };
    if (r.cast_votes > 0) {
      const parts = [
        `"${r.title}" has ${plural(r.cast_votes, 'vote', 'votes')}. Removing it deletes ${r.cast_votes === 1 ? 'that vote' : `those ${r.cast_votes} votes`}.`,
      ];
      if (wasDefault) parts.push('It is the default pick. The earliest remaining activity becomes the default pick.');
      await confirmAction({ title: 'Remove this activity?', consequence: parts, okLabel: 'Remove activity', run });
      return;
    }
    try {
      await run();
    } catch (err) {
      fail(err, 'The activity was not removed. Try again.');
    }
  }

  async function setDefault(r) {
    msg.clear();
    const s = S.data.summary;
    await confirmAction({
      title: 'Change the default pick?',
      consequence: [
        `"${r.title}" becomes the default pick.`,
        `${s.not_voted_count} of ${s.member_count} members have not voted. When voting closes, the default pick counts once for each of them.`,
      ],
      okLabel: 'Make default pick',
      run: async () => {
        await api.setDefaultPick(tripId, r.activity_id);
        await refresh();
        msg.show(`"${r.title}" is now the default pick.`);
      },
    });
  }

  function startEdit(r) {
    msg.clear();
    const id = r.activity_id;
    const title = makeField({ testid: `edit-title-${id}`, label: 'Activity title', hint: 'Example: Whale watching cruise', value: r.title });
    const desc = makeField({
      testid: `edit-description-${id}`, label: 'Description', hint: 'One line, up to 140 characters.', required: false,
      value: r.description || '', counterId: `counter-edit-description-${id}`, counterMax: 140,
    });
    const src = makeField({
      testid: `edit-source-${id}`, label: 'Source link', hint: 'Begins with https://. Example: https://example.com/cruise',
      required: false, value: r.source_url || '', inputmode: 'url',
    });
    const save = h('button', { type: 'submit', class: 'primary', testid: `edit-save-${id}`, text: 'Save changes' });
    const cancel = h('button', { type: 'button', testid: `edit-cancel-${id}`, text: 'Cancel' });
    const form = h('form', { novalidate: true }, h('h3', { text: `Edit activity ${r.rank}` }), title.root, desc.root, src.root, h('div', { class: 'actions' }, save, cancel));
    const li = h('li', { class: 'activity editing', testid: `activity-${id}` }, form);
    const live = [
      [title, 'activityTitle'],
      [desc, 'activityDescription'],
      [src, 'sourceUrl'],
    ];
    for (const [f, name] of live) f.input.addEventListener('input', () => {
      const res = validateField(name, f.value);
      f.setError(res.ok ? '' : res.error);
    });
    cancel.addEventListener('click', () => {
      S.editNodes.delete(id);
      if (S.data) renderStanding(S.data, false);
      const btn = root.querySelector(`[data-testid="edit-${CSS.escape(id)}"]`);
      if (btn) btn.focus();
    });
    form.addEventListener('submit', async (ev) => {
      ev.preventDefault();
      if (save.getAttribute('aria-disabled')) return;
      const results = live.map(([f, name]) => [f, validateField(name, f.value)]);
      let first = null;
      for (const [f, res] of results) {
        f.setError(res.ok ? '' : res.error);
        if (!res.ok && !first) first = f;
      }
      if (first) {
        first.input.focus();
        return;
      }
      save.setAttribute('aria-disabled', 'true');
      try {
        await api.updateActivity(id, {
          title: results[0][1].value,
          description: results[1][1].value || null,
          source_url: results[2][1].value || null,
        });
        S.editNodes.delete(id);
        await refresh();
        msg.show(`Saved changes to "${results[0][1].value}".`);
        const btn = root.querySelector(`[data-testid="edit-${CSS.escape(id)}"]`);
        if (btn) btn.focus();
      } catch (err) {
        fail(err, 'Your changes were not saved. Try again.');
      } finally {
        save.removeAttribute('aria-disabled');
      }
    });
    const old = listEl.querySelector(`[data-testid="activity-${CSS.escape(id)}"]`);
    S.editNodes.set(id, li);
    if (old) old.replaceWith(li);
    title.input.focus();
  }

  // ----- members ---------------------------------------------------------

  function renderMembers(data) {
    const members = [...data.members].sort((a, b) => String(a.joined_at).localeCompare(String(b.joined_at)));
    const s = data.summary;
    setKids(
      membersEl,
      h('h2', { text: `Members, ${plural(s.member_count, 'member', 'members')}` }),
      members.length
        ? h(
            'table',
            { testid: 'members-table' },
            h('thead', {}, h('tr', {}, h('th', { scope: 'col', text: 'Member' }), h('th', { scope: 'col', text: 'Votes' }))),
            h(
              'tbody',
              {},
              members.map((m) => {
                const n = data.voters.filter((v) => v.voter === m.voter).length;
                return h('tr', {}, h('td', { text: m.display_name }), h('td', { text: m.has_voted ? plural(n, 'vote', 'votes') : 'Has not voted' }));
              }),
            ),
          )
        : h('p', { text: 'No members yet.' }),
      h('p', { class: 'muted', text: `Source: members recorded for this trip, as of ${formatAsOf(s.as_of)}.` }),
    );
  }

  // ----- organizer actions -----------------------------------------------

  function renderOrganizer(data, closed) {
    const s = data.summary;
    const mode = closed ? 'closed' : 'open';
    if (S.orgMode !== mode) {
      S.orgMode = mode;
      buildOrganizer(closed);
    }
    if (sizeHint) sizeHint.textContent = `Required. Whole number from 1 to 30, counted in activities. The trip has ${plural(s.activity_count, 'activity', 'activities')} now.`;
    if (sizeField && document.activeElement !== sizeField.input && !sizeField.error) {
      sizeField.input.value = String(s.itinerary_size);
    }
  }

  function buildOrganizer(closed) {
    sizeField = null;
    sizeHint = null;
    const del = h('button', { type: 'button', testid: 'delete-trip', text: 'Delete trip', onClick: deleteTrip });
    if (closed) {
      const reopen = h('button', { type: 'button', testid: 'reopen-voting', text: 'Reopen voting', onClick: reopen_ });
      setKids(
        organizerEl,
        h('h2', { text: 'Organizer actions' }),
        h('p', { class: 'hint', text: 'Anyone with the link can use these actions.' }),
        h('div', { class: 'subsection' }, h('h3', { text: 'Reopen voting' }), h('p', { text: 'Reopening clears the confirmed itinerary and restores the live standing.' }), h('div', { class: 'actions' }, reopen)),
        h('div', { class: 'subsection' }, h('h3', { text: 'Delete trip' }), h('p', { text: 'Deleting removes the trip, its activities, and all votes.' }), h('div', { class: 'actions' }, del)),
      );
      return;
    }

    // Itinerary size
    sizeField = makeField({
      testid: 'itinerary-size-input', errorId: 'itinerary-size-input', label: 'Itinerary size (activities)', hint: '',
      type: 'number', min: '1', max: '30', step: '1', value: String(S.data.summary.itinerary_size),
    });
    sizeHint = sizeField.hint;
    const sizeSave = h('button', { type: 'submit', testid: 'itinerary-size-save', text: 'Save size' });
    const sizeForm = h('form', { novalidate: true }, sizeField.root, h('div', { class: 'actions' }, sizeSave));
    sizeField.input.addEventListener('input', () => {
      const r = validateField('itinerarySize', sizeField.value);
      sizeField.setError(r.ok ? '' : r.error);
    });
    sizeForm.addEventListener('submit', async (ev) => {
      ev.preventDefault();
      if (sizeSave.getAttribute('aria-disabled')) return;
      const r = validateField('itinerarySize', sizeField.value);
      sizeField.setError(r.ok ? '' : r.error);
      if (!r.ok) {
        sizeField.input.focus();
        return;
      }
      sizeSave.setAttribute('aria-disabled', 'true');
      try {
        await api.updateTrip(tripId, { itinerary_size: r.value });
        await refresh();
        msg.show(`Itinerary size saved: ${plural(r.value, 'activity', 'activities')}.`);
      } catch (err) {
        fail(err, 'The itinerary size was not saved. Try again.');
      } finally {
        sizeSave.removeAttribute('aria-disabled');
      }
    });

    // Add activity
    const t = makeField({ testid: 'add-activity-title', errorId: 'add-activity-title', label: 'Activity title', hint: 'Example: Whale watching cruise' });
    const d = makeField({
      testid: 'add-activity-description', errorId: 'add-activity-description', label: 'Description', hint: 'One line, up to 140 characters.',
      required: false, counterId: 'counter-add-activity-description', counterMax: 140,
    });
    const u = makeField({
      testid: 'add-activity-source', errorId: 'add-activity-source', label: 'Source link', hint: 'Begins with https://. Example: https://example.com/cruise',
      required: false, inputmode: 'url',
    });
    const addBtn = h('button', { type: 'submit', testid: 'add-activity-submit', text: 'Add activity' });
    const addForm = h('form', { novalidate: true }, t.root, d.root, u.root, h('div', { class: 'actions' }, addBtn));
    const addChecks = [[t, 'activityTitle'], [d, 'activityDescription'], [u, 'sourceUrl']];
    for (const [f, name] of addChecks) {
      f.input.addEventListener('input', () => {
        const r = validateField(name, f.value);
        f.setError(r.ok ? '' : r.error);
      });
    }
    addForm.addEventListener('submit', async (ev) => {
      ev.preventDefault();
      if (addBtn.getAttribute('aria-disabled')) return;
      msg.clear();
      const results = addChecks.map(([f, name]) => [f, validateField(name, f.value)]);
      let first = null;
      for (const [f, r] of results) {
        f.setError(r.ok ? '' : r.error);
        if (!r.ok && !first) first = f;
      }
      if (first) {
        first.input.focus();
        return;
      }
      if (S.data.summary.activity_count >= MAX_ACTIVITIES) {
        msg.show(`A trip can have up to ${MAX_ACTIVITIES} activities. Remove one before adding another.`, 'alert');
        return;
      }
      addBtn.setAttribute('aria-disabled', 'true');
      try {
        await api.addActivity(tripId, {
          title: results[0][1].value,
          description: results[1][1].value || null,
          source_url: results[2][1].value || null,
        });
        const added = results[0][1].value;
        t.value = '';
        d.value = '';
        u.value = '';
        await refresh();
        msg.show(`Added "${added}".`);
      } catch (err) {
        fail(err, 'The activity was not added. Try again.');
      } finally {
        addBtn.removeAttribute('aria-disabled');
      }
    });

    const closeBtn = h('button', { type: 'button', testid: 'close-voting', text: 'Close voting now', onClick: closeVoting });
    setKids(
      organizerEl,
      h('h2', { text: 'Organizer actions' }),
      h('p', { class: 'hint', text: 'Anyone with the link can use these actions until voting closes.' }),
      h('div', { class: 'subsection' }, h('h3', { text: 'Itinerary size' }), sizeForm),
      h('div', { class: 'subsection' }, h('h3', { text: 'Add an activity' }), addForm),
      h('div', { class: 'subsection' }, h('h3', { text: 'Close voting' }), h('p', { text: 'Voting also closes by itself at the deadline.' }), h('div', { class: 'actions' }, closeBtn)),
      h('div', { class: 'subsection' }, h('h3', { text: 'Delete trip' }), h('p', { text: 'Deleting removes the trip, its activities, and all votes.' }), h('div', { class: 'actions' }, del)),
    );
  }

  async function closeVoting() {
    msg.clear();
    const s = S.data.summary;
    const def = S.data.standing.find((r) => r.is_default_pick);
    await confirmAction({
      title: 'Close voting now?',
      consequence: [
        `${s.not_voted_count} of ${s.member_count} members have not voted. The default pick${def ? `, "${def.title}",` : ''} counts once for each.`,
        `The itinerary is confirmed with ${plural(s.cast_votes_total, 'cast vote', 'cast votes')}. No votes can change until voting is reopened.`,
      ],
      okLabel: 'Close voting',
      run: async () => {
        await api.closeTrip(tripId);
        await refresh();
      },
    });
    const st = root.querySelector('[data-testid="confirmed-statement"]');
    if (st) st.scrollIntoView({ block: 'nearest' });
  }

  async function reopen_() {
    msg.clear();
    const s = S.data.summary;
    const passed = Date.parse(s.voting_deadline) <= Date.now();
    if (!passed) {
      try {
        await api.reopenTrip(tripId, null);
        await refresh();
        msg.show(`Voting reopened. Voting closes ${formatDeadline(S.data.summary.voting_deadline)}.`);
      } catch (err) {
        fail(err, 'Voting was not reopened. Try again.');
      }
      return;
    }
    await confirmAction({
      title: 'Reopen voting?',
      consequence: [
        `The deadline of ${formatDeadline(s.voting_deadline)} has passed, so choose a new deadline.`,
        'Reopening clears the confirmed itinerary and restores the live standing.',
      ],
      okLabel: 'Reopen voting',
      deadline: { label: 'New voting deadline', hint: 'Date and time, in the future, in your time zone.' },
      run: async ({ deadline }) => {
        await api.reopenTrip(tripId, deadline);
        await refresh();
        msg.show(`Voting reopened. Voting closes ${formatDeadline(S.data.summary.voting_deadline)}.`);
      },
    });
  }

  async function deleteTrip() {
    msg.clear();
    const s = S.data.summary;
    const votes = s.cast_votes_total;
    await confirmAction({
      title: 'Delete this trip?',
      consequence: `Deleting removes the trip, ${plural(s.activity_count, 'activity', 'activities')}, ${plural(votes, 'vote', 'votes')}, and ${plural(s.member_count, 'member', 'members')}. This cannot be undone.`,
      okLabel: 'Delete trip',
      input: {
        label: 'Type the trip name to confirm',
        hint: `Type exactly: ${s.name}`,
        check: (v) => validateField('deleteConfirm', v, { tripName: s.name }),
      },
      run: async () => {
        const out = await api.deleteTrip(tripId, s.name);
        S.gone = true;
        cleanup();
        hideNotice();
        setTitle('Trip deleted | Where Should We Go?');
        const a = out && out.activities != null ? out.activities : s.activity_count;
        const v = out && out.votes != null ? out.votes : votes;
        const m = out && out.members != null ? out.members : s.member_count;
        setKids(
          root,
          h('header', { class: 'masthead' }, h('h1', { text: 'Trip deleted' })),
          h('p', { testid: 'deleted-text', role: 'status', text: `Deleted. ${plural(a, 'activity', 'activities')}, ${plural(v, 'vote', 'votes')}, and ${plural(m, 'member', 'members')} were removed.` }),
          h('div', { class: 'actions' }, h('a', { class: 'button', href: location.pathname, text: 'Plan a new trip' })),
        );
      },
    });
  }

  // ----- timers and listeners --------------------------------------------

  function scheduleDeadline(s, closed) {
    clearTimeout(S.timer);
    S.timer = null;
    if (closed) return;
    const ms = Date.parse(s.voting_deadline) - Date.now();
    if (!Number.isFinite(ms)) return;
    const wait = Math.min(Math.max(ms, 0) + 1000, 6 * 3600 * 1000);
    S.timer = setTimeout(refresh, wait);
  }

  const onOnline = () => refresh();
  const onOffline = () => showNotice('You are offline. Live updates are paused and will resume when the connection returns.');
  window.addEventListener('online', onOnline);
  window.addEventListener('offline', onOffline);
  S.unsub = api.subscribe(tripId, () => refresh());

  function cleanup() {
    clearTimeout(S.timer);
    window.removeEventListener('online', onOnline);
    window.removeEventListener('offline', onOffline);
    if (S.unsub) {
      try {
        S.unsub();
      } catch {
        /* nothing to do */
      }
      S.unsub = null;
    }
  }

  refresh();
  return () => {
    S.gone = true;
    cleanup();
  };
}
