// Create screen: step 1 form, step 2 read-back, step 3 link.
import { createTrip, getVoterId, getSavedName, saveName } from '../api.js';
import { validateField, validateTripForm } from '../validate.js';
import { formatDate, formatRange, formatDeadline, dayCount, plural } from '../format.js';
import { h, setKids, makeField, makeMessage, guarded, focusAndShow, copyText, setTitle, timeZoneLabel, domainOf } from '../ui.js';

const KEY = {
  'trip-name': 'tripName',
  destination: 'destination',
  'start-date': 'startDate',
  'end-date': 'endDate',
  'voting-deadline': 'votingDeadline',
  'itinerary-size': 'itinerarySize',
  'organizer-name': 'organizerName',
};
const SCALARS = Object.keys(KEY);
const MIN_ROWS = 3;
const MAX_ROWS = 10;
const ACT_PROPS = { title: 'title', description: 'description', source: 'sourceUrl' };

export function mountCreate(root) {
  setTitle('Where Should We Go? Plan a trip');

  const model = {
    tripName: '',
    destination: '',
    startDate: '',
    endDate: '',
    votingDeadline: '',
    itinerarySize: '',
    organizerName: getSavedName() || '',
    activities: [blankRow(), blankRow(), blankRow()],
  };
  let step = 1;
  let submitted = false;
  let summaryShown = false;
  let lastValid = null;
  const dirty = new Set();
  const errs = new Map();
  const warns = new Map();
  let fields = new Map();
  let summaryEl = null;
  let actErrEl = null;
  let helperEl = null;

  function blankRow() {
    return { title: '', description: '', sourceUrl: '' };
  }

  // ----- validation ------------------------------------------------------

  function check(id) {
    const m = /^activity-(title|description|source)-(\d+)$/.exec(id);
    if (m) {
      const row = model.activities[Number(m[2])];
      if (!row) return { ok: true };
      if (m[1] === 'title') return validateField('activityTitle', row.title);
      if (m[1] === 'description') return validateField('activityDescription', row.description);
      return validateField('sourceUrl', row.sourceUrl);
    }
    switch (id) {
      case 'trip-name': return validateField('tripName', model.tripName);
      case 'destination': return validateField('destination', model.destination);
      case 'start-date': return validateField('startDate', model.startDate);
      case 'end-date': return validateField('endDate', model.endDate, { startDate: model.startDate });
      case 'voting-deadline': return validateField('votingDeadline', model.votingDeadline, { startDate: model.startDate });
      case 'itinerary-size': return validateField('itinerarySize', model.itinerarySize);
      case 'organizer-name': return validateField('displayName', model.organizerName);
      default: return { ok: true };
    }
  }

  function setErr(id, msg) {
    if (msg) errs.set(id, msg);
    else errs.delete(id);
    const f = fields.get(id);
    if (f) f.setError(msg || '');
    if (summaryShown) renderSummary(false);
  }

  function setWarn(id, msg) {
    if (msg) warns.set(id, msg);
    else warns.delete(id);
    const f = fields.get(id);
    if (f) f.setWarning(msg || '');
  }

  function revalidate(id, fromBlur) {
    const f = fields.get(id);
    if (!f) return;
    if (fromBlur && !dirty.has(id) && !submitted) return;
    const r = check(id);
    setErr(id, r.ok ? '' : r.error);
    setWarn(id, r.ok ? r.warning || '' : '');
  }

  function fieldOrder() {
    const ids = [...SCALARS];
    model.activities.forEach((_, i) => ids.push(`activity-title-${i}`, `activity-description-${i}`, `activity-source-${i}`));
    ids.push('activities');
    return ids;
  }

  function labelFor(id) {
    const m = /^activity-\w+-(\d+)$/.exec(id);
    return m ? `Activity ${Number(m[1]) + 1}: ` : '';
  }

  function renderSummary(focus) {
    const list = fieldOrder().filter((id) => errs.has(id));
    if (!list.length) {
      if (summaryEl) summaryEl.remove();
      summaryEl = null;
      summaryShown = false;
      return;
    }
    const was = summaryEl;
    const ul = h(
      'ul',
      { class: 'plain' },
      list.map((id) =>
        h(
          'li',
          {},
          h('a', {
            href: `#${id}`,
            text: labelFor(id) + errs.get(id),
            onClick: (ev) => {
              ev.preventDefault();
              const f = fields.get(id);
              focusAndShow(f ? f.input : addRowBtn);
            },
          }),
        ),
      ),
    );
    const heading = h('h2', { text: `${plural(list.length, 'problem', 'problems')} to fix before you review the trip.` });
    if (!summaryEl) {
      summaryEl = h('div', { class: 'error-summary', testid: 'error-summary', role: 'alert', tabindex: '-1' });
      formEl.prepend(summaryEl);
    }
    setKids(summaryEl, heading, ul);
    summaryShown = true;
    if (focus && !was) summaryEl.scrollIntoView({ block: 'nearest' });
  }

  // ----- form ------------------------------------------------------------

  function scalar(id, cfg) {
    const f = makeField({ testid: id, value: model[KEY[id]], ...cfg });
    fields.set(id, f);
    f.input.addEventListener('input', () => {
      model[KEY[id]] = f.input.value;
      dirty.add(id);
      revalidate(id);
      if (id === 'start-date') {
        for (const dep of ['end-date', 'voting-deadline']) if (dirty.has(dep) || submitted) revalidate(dep);
      }
      if (id === 'start-date' || id === 'end-date') updateEchoes();
    });
    f.input.addEventListener('blur', () => revalidate(id, true));
    return f;
  }

  let echoStart = null;
  let echoEnd = null;
  function updateEchoes() {
    if (!echoStart) return;
    echoStart.textContent = model.startDate && formatDate(model.startDate) ? `Shown as ${formatDate(model.startDate)}` : '';
    let end = '';
    if (model.endDate && formatDate(model.endDate)) {
      end = `Shown as ${formatDate(model.endDate)}`;
      const n = dayCount(model.startDate, model.endDate);
      if (Number.isFinite(n) && n >= 1) end += `. ${plural(n, 'day', 'days')}.`;
    }
    echoEnd.textContent = end;
  }

  function updateHelper() {
    if (helperEl) helperEl.textContent = `${plural(model.activities.length, 'activity', 'activities')} listed below.`;
  }

  let rowsEl = null;
  let addRowBtn = null;

  function buildRows() {
    for (const id of [...fields.keys()]) if (id.startsWith('activity-')) fields.delete(id);
    for (const id of [...errs.keys()]) if (id.startsWith('activity-')) errs.delete(id);
    for (const id of [...warns.keys()]) if (id.startsWith('activity-')) warns.delete(id);
    for (const id of [...dirty]) if (id.startsWith('activity-')) dirty.delete(id);
    const rows = model.activities.map((a, i) => {
      const cfgs = [
        ['title', { label: 'Activity title', hint: 'Example: Whale watching cruise', required: true }],
        ['description', { label: 'Description', hint: 'One line, up to 140 characters. Example: Three hours, departs 9 AM', required: false, counterMax: 140 }],
        ['source', { label: 'Source link', hint: 'Begins with https://. Example: https://example.com/cruise', required: false, type: 'text', inputmode: 'url' }],
      ];
      const made = cfgs.map(([k, cfg]) => {
        const id = `activity-${k}-${i}`;
        const f = makeField({
          testid: id,
          value: a[ACT_PROPS[k]],
          counterId: k === 'description' ? `counter-activity-description-${i}` : undefined,
          ...cfg,
        });
        fields.set(id, f);
        f.input.addEventListener('input', () => {
          model.activities[i][ACT_PROPS[k]] = f.input.value;
          dirty.add(id);
          revalidate(id);
        });
        f.input.addEventListener('blur', () => revalidate(id, true));
        return f;
      });
      return h(
        'fieldset',
        { class: 'activity-row' },
        h('legend', { text: `Activity ${i + 1}` }),
        i === 0 ? h('p', { class: 'hint', text: 'The first activity is the default pick until you change it.' }) : null,
        made.map((f) => f.root),
        h('button', {
          type: 'button',
          testid: `remove-activity-row-${i}`,
          text: `Remove activity ${i + 1}`,
          onClick: () => removeRow(i),
        }),
      );
    });
    setKids(rowsEl, rows);
    addRowBtn.disabled = model.activities.length >= MAX_ROWS;
    updateHelper();
    for (const [id, msg] of errs) {
      const f = fields.get(id);
      if (f) f.setError(msg);
    }
  }

  function setActivitiesError(msg) {
    if (!msg) {
      if (actErrEl) actErrEl.remove();
      actErrEl = null;
      errs.delete('activities');
    } else {
      if (!actErrEl) {
        actErrEl = h('p', { class: 'error', testid: 'error-activities', id: 'error-activities' });
        rowsEl.after(actErrEl);
      }
      actErrEl.textContent = msg;
      errs.set('activities', msg);
    }
    if (summaryShown) renderSummary(false);
  }

  function addRow() {
    if (model.activities.length >= MAX_ROWS) {
      setActivitiesError('You can list up to 10 activities when you create a trip. Add more after the trip exists.');
      return;
    }
    setActivitiesError('');
    model.activities.push(blankRow());
    buildRows();
    const f = fields.get(`activity-title-${model.activities.length - 1}`);
    if (f) focusAndShow(f.input);
  }

  function removeRow(i) {
    if (model.activities.length <= MIN_ROWS) {
      setActivitiesError('Add at least 3 activities. Edit this row instead of removing it.');
      return;
    }
    setActivitiesError('');
    model.activities.splice(i, 1);
    buildRows();
    const f = fields.get(`activity-title-${Math.min(i, model.activities.length - 1)}`);
    if (f) f.input.focus();
  }

  let formEl = null;

  function renderForm() {
    fields = new Map();
    summaryEl = null;
    actErrEl = null;
    const tz = timeZoneLabel();
    const name = scalar('trip-name', { label: 'Trip name', hint: 'Example: Cape Cod, October' });
    const dest = scalar('destination', { label: 'Destination', hint: 'Example: Provincetown, MA' });
    const start = scalar('start-date', { label: 'Start date', hint: 'Pick from the calendar. Example: Sat, Oct 10, 2026', type: 'date' });
    const end = scalar('end-date', { label: 'End date', hint: 'On or after the start date. Example: Wed, Oct 14, 2026', type: 'date' });
    echoStart = h('p', { class: 'echo', testid: 'echo-start-date' });
    echoEnd = h('p', { class: 'echo', testid: 'echo-end-date' });
    start.input.after(echoStart);
    end.input.after(echoEnd);
    const deadline = scalar('voting-deadline', {
      label: `Voting deadline (${tz})`,
      hint: `Date and time, in the future. Times are in ${tz}. Example: Oct 5, 2026, 9:00 PM`,
      type: 'datetime-local',
    });
    const size = scalar('itinerary-size', {
      label: 'Itinerary size (activities)',
      hint: 'Whole number from 1 to 30, counted in activities. Example: 6',
      type: 'number',
      min: '1',
      max: '30',
      step: '1',
    });
    helperEl = h('p', { class: 'hint', testid: 'itinerary-helper' });
    size.input.after(helperEl);
    const who = scalar('organizer-name', { label: 'Your name', hint: 'Shown beside your votes. Example: Pat Jones' });

    rowsEl = h('div', { class: 'rows', testid: 'activity-rows' });
    addRowBtn = h('button', { type: 'button', testid: 'add-activity-row', text: 'Add activity', onClick: addRow });
    const review = h('button', { type: 'submit', class: 'primary accent', testid: 'review-button', text: 'Review trip' });

    formEl = h(
      'form',
      { novalidate: true, class: 'sheet' },
      h(
        'section',
        {},
        h('h2', { text: 'Trip' }),
        name.root,
        dest.root,
        who.root,
      ),
      h('section', {}, h('h2', { text: 'Dates and voting' }), start.root, end.root, deadline.root, size.root),
      h(
        'section',
        {},
        h('h2', { text: 'Activities' }),
        h('p', {
          text: 'List 3 to 10 activities. Anyone who has not voted when voting closes counts as one vote for the default pick.',
        }),
        rowsEl,
        h('div', { class: 'actions' }, addRowBtn),
      ),
      h('section', {}, h('p', { class: 'hint', text: 'Next you will see everything you entered once more before the trip is created.' }), h('div', { class: 'actions' }, review)),
    );
    formEl.addEventListener('submit', (ev) => {
      ev.preventDefault();
      onReview();
    });
    buildRows();
    updateEchoes();
    setKids(
      root,
      h('header', { class: 'masthead' }, h('h1', { text: 'Where Should We Go?' }), h('p', { class: 'lede', text: 'Plan a group trip. List the activities, share one link, and everyone votes.' })),
      formEl,
    );
    // Re-apply stored messages.
    for (const [id, msg] of errs) {
      const f = fields.get(id);
      if (f) f.setError(msg);
    }
    for (const [id, msg] of warns) {
      const f = fields.get(id);
      if (f) f.setWarning(msg);
    }
  }

  function formInput() {
    return {
      tripName: model.tripName,
      destination: model.destination,
      startDate: model.startDate,
      endDate: model.endDate,
      votingDeadline: model.votingDeadline,
      itinerarySize: model.itinerarySize,
      organizerName: model.organizerName,
      activities: model.activities.map((a) => ({ title: a.title, description: a.description, sourceUrl: a.sourceUrl })),
    };
  }

  function onReview() {
    submitted = true;
    const res = validateTripForm(formInput());
    for (const id of fieldOrder()) {
      if (id === 'activities') continue;
      setErr(id, res.errors[id] || '');
      setWarn(id, res.errors[id] ? '' : res.warnings[id] || '');
    }
    setActivitiesError(res.errors.activities || '');
    if (!res.ok) {
      summaryShown = true;
      renderSummary(true);
      const first = fieldOrder().find((id) => errs.has(id));
      const f = first && fields.get(first);
      focusAndShow(f ? f.input : addRowBtn);
      return;
    }
    lastValid = res;
    step = 2;
    renderReview();
  }

  // ----- step 2: read-back -----------------------------------------------

  function renderReview() {
    const v = lastValid.value;
    const n = v.activities.length;
    const facts = [
      ['Trip name', v.name],
      ['Destination', v.destination],
      ['Your name', v.organizer_name],
      ['Dates', formatRange(v.start_date, v.end_date)],
      ['Voting deadline', formatDeadline(v.voting_deadline)],
      ['Itinerary size', plural(v.itinerary_size, 'activity', 'activities')],
      ['Activities listed', plural(n, 'activity', 'activities')],
    ];
    const notes = [];
    for (const id of ['end-date', 'voting-deadline']) if (lastValid.warnings[id]) notes.push(lastValid.warnings[id]);
    if (v.itinerary_size > n) {
      notes.push(`Itinerary size is ${plural(v.itinerary_size, 'activity', 'activities')} but ${plural(n, 'activity is', 'activities are')} listed. The itinerary will list all activities until more are added.`);
    }
    const createBtn = h('button', { type: 'button', class: 'primary accent', testid: 'create-confirm', text: 'Create trip' });
    const errorLine = h('p', { class: 'error', testid: 'create-error', role: 'alert', hidden: true });
    setKids(
      root,
      h('header', { class: 'masthead' }, h('h1', { text: 'Review your trip' }), h('p', { class: 'lede', text: 'Check every value below. Nothing is saved until you press Create trip.' })),
      h(
        'section',
        { testid: 'review-summary' },
        h('dl', { class: 'facts' }, facts.map(([k, val]) => h('div', { class: 'fact' }, h('dt', { text: k }), h('dd', { text: val })))),
        h('h2', { text: `Activities, ${plural(n, 'activity', 'activities')}` }),
        h(
          'ol',
          { class: 'review-activities' },
          v.activities.map((a, i) =>
            h(
              'li',
              {},
              h('span', { class: 'strong', text: a.title }),
              i === 0 ? h('span', { class: 'flag', text: ' Default pick' }) : null,
              a.description ? h('span', { class: 'block', text: a.description }) : null,
              a.source_url ? h('span', { class: 'block muted', text: `Web address: ${a.source_url} (shown as ${domainOf(a.source_url)})` }) : null,
            ),
          ),
        ),
        notes.length ? h('div', {}, h('h2', { text: 'Notes' }), notes.map((t) => h('p', { text: t }))) : null,
        h('p', {
          text: `The default pick is "${v.activities[0].title}". Anyone with the trip link can vote, edit, and delete this trip.`,
        }),
      ),
      h('div', { class: 'actions' }, createBtn, h('button', { type: 'button', testid: 'review-edit', text: 'Edit trip details', onClick: () => { step = 1; renderForm(); const f = fields.get('trip-name'); if (f) f.input.focus(); } })),
      errorLine,
    );
    guarded(createBtn, async () => {
      errorLine.hidden = true;
      try {
        const payload = { ...lastValid.value, voter: getVoterId() };
        const out = await createTrip(payload);
        saveName(lastValid.value.organizer_name);
        renderDone(out.id, lastValid.value);
      } catch (err) {
        errorLine.textContent = (err && err.message) || 'The trip was not created. Check your connection and try again.';
        errorLine.hidden = false;
      }
    });
    const heading = root.querySelector('h1');
    if (heading) {
      heading.setAttribute('tabindex', '-1');
      heading.focus({ preventScroll: true });
    }
    window.scrollTo(0, 0);
  }

  // ----- step 3: link ----------------------------------------------------

  function renderDone(id, v) {
    const url = new URL(`?trip=${id}`, `${location.origin}${location.pathname}`).href;
    const status = makeMessage('copy-status');
    const copyBtn = h('button', { type: 'button', testid: 'copy-link', text: 'Copy link' });
    copyBtn.addEventListener('click', async () => {
      const ok = await copyText(url);
      status.show(ok ? 'Link copied.' : 'Copy did not work. Select the link above and copy it.', ok ? 'status' : 'alert');
    });
    setTitle(`${v.name} | Where Should We Go?`);
    setKids(
      root,
      h('header', { class: 'masthead' }, h('h1', { text: 'Trip created' }), h('p', { class: 'lede', text: `${v.name}, ${v.destination}. Share this link with your group.` })),
      h(
        'section',
        {},
        h('h2', { text: 'Trip link' }),
        h('p', { class: 'link-text', testid: 'trip-link', text: url }),
        h('div', { class: 'actions' }, copyBtn, h('a', { class: 'button primary accent', testid: 'open-trip', href: url, text: 'Open trip' })),
        status.el,
        h('p', { class: 'hint', text: 'Anyone with this link can vote, edit, and delete this trip.' }),
      ),
      h(
        'section',
        { testid: 'created-details' },
        h('h2', { text: 'Saved trip details' }),
        h(
          'dl',
          { class: 'facts' },
          [
            ['Trip name', v.name],
            ['Destination', v.destination],
            ['Dates', formatRange(v.start_date, v.end_date)],
            ['Voting deadline', formatDeadline(v.voting_deadline)],
            ['Itinerary size', plural(v.itinerary_size, 'activity', 'activities')],
            ['Activities', plural(v.activities.length, 'activity', 'activities')],
          ].map(([k, val]) => h('div', { class: 'fact' }, h('dt', { text: k }), h('dd', { text: val }))),
        ),
        h('p', { class: 'hint', text: 'To change any of these details, open the trip and use Edit trip details.' }),
      ),
    );
    const heading = root.querySelector('h1');
    heading.setAttribute('tabindex', '-1');
    heading.focus({ preventScroll: true });
    window.scrollTo(0, 0);
  }

  renderForm();
  return () => {};
}
