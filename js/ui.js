// Small DOM helpers shared by the screens. All text goes in through textContent or
// text nodes. Nothing in this project builds markup from user text.
import { validateField } from './validate.js';
import { viewerTimeZone } from './format.js';

/** Build an element. props: class, text, testid, hidden, on<event>, and plain attributes. */
export function h(tag, props, ...kids) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(props || {})) {
    if (v === null || v === undefined || v === false) continue;
    if (k === 'class') node.className = v;
    else if (k === 'text') node.textContent = String(v);
    else if (k === 'testid') node.setAttribute('data-testid', v);
    else if (k === 'value') node.value = v;
    else if (k.length > 2 && k.startsWith('on')) node.addEventListener(k.slice(2).toLowerCase(), v);
    else if (v === true) node.setAttribute(k, '');
    else node.setAttribute(k, String(v));
  }
  appendKids(node, kids);
  return node;
}

function appendKids(node, kids) {
  for (const kid of kids.flat(Infinity)) {
    if (kid === null || kid === undefined || kid === false) continue;
    node.append(kid instanceof Node ? kid : document.createTextNode(String(kid)));
  }
}

/** Replace all children of a node. */
export function setKids(node, ...kids) {
  node.replaceChildren();
  appendKids(node, kids);
  return node;
}

export function byTestId(root, id) {
  return root.querySelector(`[data-testid="${CSS.escape(id)}"]`);
}

/** Domain of a web address without a leading www, for display. */
export function domainOf(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}

/** Time zone name for labels, for example "Eastern Daylight Time". */
export function timeZoneLabel() {
  try {
    const parts = new Intl.DateTimeFormat('en-US', { timeZoneName: 'long' }).formatToParts(new Date());
    const p = parts.find((x) => x.type === 'timeZoneName');
    const zone = viewerTimeZone();
    if (p && zone) return `${p.value}, ${zone}`;
    return (p && p.value) || zone || 'your local time zone';
  } catch {
    return 'your local time zone';
  }
}

// ---------------------------------------------------------------------------
// Fields

let uid = 0;

/**
 * A labeled input with hint, optional counter, and on-demand error and warning lines.
 * testid is also the element id, and the error line is error-<errorId || testid>.
 */
export function makeField(o) {
  const id = o.testid;
  const errId = o.errorId || o.testid;
  const hintId = `hint-${id}-${++uid}`;
  const input = h('input', {
    id,
    testid: id,
    type: o.type || 'text',
    name: id,
    autocomplete: o.autocomplete || 'off',
    inputmode: o.inputmode,
    min: o.min,
    max: o.max,
    step: o.step,
    'aria-describedby': hintId,
    value: o.value ?? '',
  });
  if (o.type === 'number') input.setAttribute('inputmode', 'numeric');
  const hintText = `${o.required === false ? 'Optional' : 'Required'}. ${o.hint || ''}`.trim();
  const hint = h('p', { class: 'hint', id: hintId, text: hintText });
  const root = h('div', { class: 'field' }, h('label', { for: id, text: o.label }), hint, input);
  let counter = null;
  if (o.counterId) {
    counter = h('p', { class: 'hint counter', testid: o.counterId, 'aria-live': 'off' });
    const update = () => {
      const n = [...input.value].length;
      counter.textContent = `${n} of ${o.counterMax} characters`;
    };
    input.addEventListener('input', update);
    update();
    root.append(counter);
  }
  let errEl = null;
  let warnEl = null;
  const describe = () => {
    const ids = [hintId];
    if (errEl) ids.push(errEl.id);
    if (warnEl) ids.push(warnEl.id);
    input.setAttribute('aria-describedby', ids.join(' '));
  };
  const field = {
    root,
    input,
    hint,
    counter,
    get value() {
      return input.value;
    },
    set value(v) {
      input.value = v ?? '';
      input.dispatchEvent(new Event('input'));
    },
    setError(msg) {
      if (!msg) {
        if (errEl) errEl.remove();
        errEl = null;
        input.removeAttribute('aria-invalid');
        describe();
        return;
      }
      if (!errEl) {
        errEl = h('p', { class: 'error', id: `error-${id}`, testid: `error-${errId}` });
        input.after(errEl);
      }
      errEl.textContent = msg;
      input.setAttribute('aria-invalid', 'true');
      describe();
    },
    setWarning(msg) {
      if (!msg) {
        if (warnEl) warnEl.remove();
        warnEl = null;
        describe();
        return;
      }
      if (!warnEl) {
        warnEl = h('p', { class: 'warning', id: `warning-${id}`, testid: `warning-${errId}` });
        (errEl || input).after(warnEl);
      }
      warnEl.textContent = msg;
      describe();
    },
    get error() {
      return errEl ? errEl.textContent : '';
    },
  };
  return field;
}

// ---------------------------------------------------------------------------
// Messages and notices

/** Status line used for results and failures. kind: 'status' or 'alert'. */
export function makeMessage(testid) {
  const el = h('p', { class: 'message', testid, role: 'status', hidden: true });
  return {
    el,
    show(text, kind = 'status') {
      el.textContent = text;
      el.setAttribute('role', kind === 'alert' ? 'alert' : 'status');
      el.hidden = !text;
    },
    clear() {
      el.textContent = '';
      el.hidden = true;
    },
  };
}

/** Notice bar at the top of the page, for example the reconnecting message. */
export function showNotice(text) {
  const el = document.getElementById('notice');
  if (!el) return;
  el.textContent = text;
  el.hidden = false;
}

export function hideNotice() {
  const el = document.getElementById('notice');
  if (!el) return;
  el.textContent = '';
  el.hidden = true;
}

export function setTitle(text) {
  document.title = text;
}

/** Run an async action once at a time for a button. A second press while busy does nothing. */
export function guarded(button, fn) {
  let busy = false;
  button.addEventListener('click', async (ev) => {
    ev.preventDefault();
    if (busy) return;
    busy = true;
    button.setAttribute('aria-disabled', 'true');
    button.dataset.busy = 'true';
    try {
      await fn(ev);
    } finally {
      busy = false;
      button.removeAttribute('aria-disabled');
      delete button.dataset.busy;
    }
  });
}

/** Move focus and scroll to an element, honoring reduced motion through the browser default. */
export function focusAndShow(el) {
  if (!el) return;
  el.scrollIntoView({ block: 'center' });
  el.focus({ preventScroll: true });
}

/** Keep keyboard focus across a re-render. Call the returned function after rebuilding. */
export function keepFocus(root) {
  const active = document.activeElement;
  if (!active || !root.contains(active)) return () => {};
  const testid = active.getAttribute('data-testid');
  return () => {
    if (active.isConnected) {
      if (document.activeElement !== active) active.focus({ preventScroll: true });
      return;
    }
    if (testid) {
      const again = byTestId(root, testid);
      if (again) again.focus({ preventScroll: true });
    }
  };
}

export async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const temp = h('textarea', { 'aria-hidden': 'true', tabindex: '-1', class: 'offscreen', readonly: true });
    temp.value = text;
    document.body.append(temp);
    temp.select();
    let done = false;
    try {
      done = document.execCommand('copy');
    } catch {
      done = false;
    }
    temp.remove();
    return done;
  }
}

// ---------------------------------------------------------------------------
// Confirmation dialog

/**
 * Confirmation dialog that states the consequence in numbers.
 * o: { title, consequence (string or array), okLabel, cancelLabel,
 *      input: { label, hint, check(value) -> { ok, error } },
 *      deadline: { label, hint },
 *      run(values) -> Promise  (called on OK; errors show in the dialog and it stays open) }
 * Resolves true when the action ran, false when cancelled.
 */
export function confirmAction(o) {
  return new Promise((resolve) => {
    const opener = document.activeElement;
    const openerId = opener && opener.getAttribute ? opener.getAttribute('data-testid') : null;
    const dlg = h('dialog', { testid: 'confirm-dialog', 'aria-labelledby': 'confirm-title' });
    const consequence = Array.isArray(o.consequence) ? o.consequence.filter(Boolean).join(' ') : o.consequence;
    const errorLine = h('p', { class: 'error', testid: 'confirm-error', role: 'alert', hidden: true });
    let inputField = null;
    let deadlineField = null;
    const form = h('form', { method: 'dialog', novalidate: true });
    form.append(h('h2', { id: 'confirm-title', text: o.title }), h('p', { testid: 'confirm-consequence', text: consequence }));
    if (o.input) {
      inputField = makeField({
        testid: 'confirm-input',
        errorId: 'confirm-input',
        label: o.input.label,
        hint: o.input.hint,
        required: true,
      });
      form.append(inputField.root);
    }
    if (o.deadline) {
      deadlineField = makeField({
        testid: 'reopen-deadline',
        errorId: 'reopen-deadline',
        label: o.deadline.label,
        hint: o.deadline.hint,
        type: 'datetime-local',
        required: true,
      });
      form.append(deadlineField.root);
    }
    const ok = h('button', { type: 'submit', class: 'primary', testid: 'confirm-ok', text: o.okLabel });
    const cancel = h('button', { type: 'button', testid: 'confirm-cancel', text: o.cancelLabel || 'Cancel' });
    form.append(errorLine, h('div', { class: 'actions' }, ok, cancel));
    dlg.append(form);
    document.body.append(dlg);

    let result = false;
    let busy = false;
    cancel.addEventListener('click', () => {
      if (!busy) dlg.close();
    });
    dlg.addEventListener('cancel', (ev) => {
      if (busy) ev.preventDefault();
    });
    dlg.addEventListener('close', () => {
      dlg.remove();
      // A live refresh may have rebuilt the list while the dialog was open, so find the control again.
      const back = opener && opener.isConnected ? opener : openerId ? byTestId(document, openerId) : null;
      if (back && typeof back.focus === 'function') back.focus({ preventScroll: true });
      resolve(result);
    });
    form.addEventListener('submit', async (ev) => {
      ev.preventDefault();
      if (busy) return;
      errorLine.hidden = true;
      const values = {};
      let bad = false;
      if (inputField) {
        const r = o.input.check(inputField.value);
        inputField.setError(r.ok ? '' : r.error);
        if (!r.ok) {
          bad = true;
          inputField.input.focus();
        }
        values.input = inputField.value;
      }
      if (deadlineField) {
        const r = validateField('votingDeadline', deadlineField.value, {});
        deadlineField.setError(r.ok ? '' : r.error);
        if (!r.ok) {
          if (!bad) deadlineField.input.focus();
          bad = true;
        }
        values.deadline = r.ok ? r.value : null;
      }
      if (bad) return;
      busy = true;
      ok.setAttribute('aria-disabled', 'true');
      cancel.disabled = true;
      try {
        await o.run(values);
        result = true;
        busy = false;
        dlg.close();
      } catch (err) {
        busy = false;
        ok.removeAttribute('aria-disabled');
        cancel.disabled = false;
        errorLine.textContent = (err && err.message) || 'Something went wrong. Try again.';
        errorLine.hidden = false;
      }
    });
    dlg.showModal();
    (inputField ? inputField.input : deadlineField ? deadlineField.input : cancel).focus();
  });
}
