// Design audit for docs/CONTRACT.md section 6 (PRD section 9).
// auditPage() runs inside the page and returns lists of violations by category. Empty lists pass.
import { readdirSync, readFileSync, statSync, existsSync } from 'node:fs';
import { join } from 'node:path';

export const CATEGORIES = [
  'accentCount', 'accentClass', 'accentWrongItem', 'nonNeutralColor', 'verticalBorder', 'thickRule', 'boxShadow', 'gradientOrImage',
  'background', 'media', 'emoji', 'serif', 'fontSizes', 'tabularNumerals', 'contrast', 'tapTarget', 'horizontalScroll', 'animation',
];

// Serialized into the page. Must be self-contained.
function inPage(expectedAccent) {
  const out = Object.fromEntries(['accentCount', 'accentClass', 'accentWrongItem', 'nonNeutralColor', 'verticalBorder', 'thickRule', 'boxShadow', 'gradientOrImage',
    'background', 'media', 'emoji', 'serif', 'fontSizes', 'tabularNumerals', 'contrast', 'tapTarget', 'horizontalScroll', 'animation'].map((k) => [k, []]));
  const isAccent = (c) => /^rgba?\(\s*139,\s*26,\s*26/.test(c);
  const parse = (c) => {
    const m = c.match(/rgba?\(([^)]+)\)/);
    if (!m) return null;
    const p = m[1].split(/[,\s/]+/).filter(Boolean).map(Number);
    return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 };
  };
  const label = (el) => {
    const tid = el.getAttribute('data-testid');
    const txt = (el.innerText || el.value || '').trim().slice(0, 30).replace(/\s+/g, ' ');
    return `<${el.tagName.toLowerCase()}${tid ? ` data-testid="${tid}"` : ''}${el.className && typeof el.className === 'string' ? ` class="${el.className}"` : ''}>${txt ? ' "' + txt + '"' : ''}`;
  };
  const lum = ({ r, g, b }) => {
    const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
  };
  const ratio = (a, b) => { const l1 = lum(a), l2 = lum(b); return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05); };
  const blend = (fg, bg) => ({ r: fg.r * fg.a + bg.r * (1 - fg.a), g: fg.g * fg.a + bg.g * (1 - fg.a), b: fg.b * fg.a + bg.b * (1 - fg.a), a: 1 });
  const effectiveBg = (el) => {
    const chain = [];
    for (let e = el; e; e = e.parentElement) chain.push(e);
    let bg = { r: 255, g: 255, b: 255, a: 1 };
    for (const e of chain.reverse()) {
      const c = parse(getComputedStyle(e).backgroundColor);
      if (c && c.a > 0) bg = blend(c, bg);
    }
    return bg;
  };
  const cumulativeOpacity = (el) => { let o = 1; for (let e = el; e; e = e.parentElement) o *= parseFloat(getComputedStyle(e).opacity); return o; };
  const neutral = (c) => { const p = parse(c); if (!p || p.a === 0) return true; return Math.max(p.r, p.g, p.b) - Math.min(p.r, p.g, p.b) <= 24; };
  const visible = (el) => el.getClientRects().length > 0 && getComputedStyle(el).visibility !== 'hidden';
  const hasOwnText = (el) => [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim());
  const isControl = (el) => /^(INPUT|TEXTAREA|SELECT|BUTTON)$/.test(el.tagName);

  const els = [document.documentElement, ...document.querySelectorAll('body, body *')].filter(visible);
  const accentRoots = [];
  const sizes = new Map();
  const fontFail = new Set();

  for (const el of els) {
    const cs = getComputedStyle(el);
    const parentCs = el.parentElement ? getComputedStyle(el.parentElement) : null;
    const l = label(el);

    // Accent: color, background, and border on any side.
    const textHere = (el.textContent || '').trim().length > 0 || isControl(el);
    if (isAccent(cs.color) && textHere && !(parentCs && isAccent(parentCs.color))) accentRoots.push({ el, how: 'text color' });
    if (isAccent(cs.backgroundColor)) accentRoots.push({ el, how: 'background' });
    for (const side of ['Top', 'Right', 'Bottom', 'Left']) {
      if (parseFloat(cs[`border${side}Width`]) > 0 && cs[`border${side}Style`] !== 'none' && cs[`border${side}Style`] !== 'hidden' && isAccent(cs[`border${side}Color`])) { accentRoots.push({ el, how: `${side.toLowerCase()} border` }); break; }
    }

    // Neutral color only (text, borders that show, background).
    if (!isAccent(cs.color) && !neutral(cs.color)) out.nonNeutralColor.push(`${l} text color ${cs.color}`);
    for (const side of ['Top', 'Right', 'Bottom', 'Left']) {
      const vis = parseFloat(cs[`border${side}Width`]) > 0 && cs[`border${side}Style`] !== 'none' && cs[`border${side}Style`] !== 'hidden';
      if (vis && !isAccent(cs[`border${side}Color`]) && !neutral(cs[`border${side}Color`])) out.nonNeutralColor.push(`${l} ${side} border ${cs[`border${side}Color`]}`);
    }
    if (!isAccent(cs.backgroundColor) && !neutral(cs.backgroundColor)) out.nonNeutralColor.push(`${l} background ${cs.backgroundColor}`);

    // Borders: no vertical rules and no boxes; horizontal rules thin.
    for (const side of ['Left', 'Right']) {
      if (parseFloat(cs[`border${side}Width`]) > 0 && cs[`border${side}Style`] !== 'none' && cs[`border${side}Style`] !== 'hidden') out.verticalBorder.push(`${l} has a ${side.toLowerCase()} border`);
    }
    for (const side of ['Top', 'Bottom']) {
      const w = parseFloat(cs[`border${side}Width`]);
      // The thin-rule rule applies to tables (PRD section 9); other rules, such as the masthead, are the designer's call.
      if (w > 1.5 && cs[`border${side}Style`] !== 'none' && /^(TABLE|THEAD|TBODY|TFOOT|TR|TH|TD)$/.test(el.tagName)) out.thickRule.push(`${l} ${side.toLowerCase()} rule is ${w}px`);
    }
    if (cs.boxShadow !== 'none') out.boxShadow.push(`${l} box-shadow ${cs.boxShadow}`);
    if (cs.textShadow !== 'none') out.boxShadow.push(`${l} text-shadow ${cs.textShadow}`);
    if (cs.backgroundImage !== 'none') out.gradientOrImage.push(`${l} background-image ${cs.backgroundImage.slice(0, 60)}`);
    const bg = parse(cs.backgroundColor);
    if (bg && bg.a > 0 && !(bg.r === 255 && bg.g === 255 && bg.b === 255) && !isAccent(cs.backgroundColor)) out.background.push(`${l} background ${cs.backgroundColor}`);
    if (cs.animationName !== 'none' && cs.animationIterationCount === 'infinite') out.animation.push(`${l} animation ${cs.animationName} loops forever`);

    // Fonts.
    if (hasOwnText(el) || isControl(el)) {
      const fam = cs.fontFamily.toLowerCase();
      const last = fam.split(',').pop().trim().replace(/["']/g, '');
      if (last !== 'serif') fontFail.add(`${l} font-family ${cs.fontFamily}`);
      sizes.set(cs.fontSize, (sizes.get(cs.fontSize) || 0) + 1);
    }

    // Contrast for text.
    if ((hasOwnText(el) || (isControl(el) && (el.value || '').length)) && !el.disabled && el.getAttribute('aria-disabled') !== 'true') {
      const fg = parse(cs.color);
      if (fg) {
        const op = cumulativeOpacity(el);
        const back = effectiveBg(el);
        const eff = blend({ ...fg, a: fg.a * op }, back);
        const size = parseFloat(cs.fontSize);
        const large = size >= 24 || (size >= 18.66 && parseInt(cs.fontWeight, 10) >= 700);
        const r = ratio(eff, back);
        if (r < (large ? 3 : 4.5)) out.contrast.push(`${l} contrast ${r.toFixed(2)} (needs ${large ? 3 : 4.5})`);
      }
    }
  }
  out.serif = [...fontFail];
  if (sizes.size > 4) out.fontSizes.push(`${sizes.size} distinct font sizes in use (${[...sizes.keys()].join(', ')}); the design allows at most 4`);

  // Accent count and placement.
  const uniq = [...new Set(accentRoots.map((r) => r.el))];
  if (uniq.length > 1) out.accentCount.push(`${uniq.length} elements use #8B1A1A: ${accentRoots.map((r) => `${label(r.el)} (${r.how})`).join('; ')}`);
  for (const r of accentRoots) {
    if (!r.el.closest('.accent')) out.accentClass.push(`${label(r.el)} uses #8B1A1A (${r.how}) without the .accent class`);
  }
  if (expectedAccent) {
    if (uniq.length !== 1) out.accentWrongItem.push(`expected exactly one red item (${expectedAccent}), found ${uniq.length}`);
    else if (!uniq[0].closest(`[data-testid="${expectedAccent}"]`) && !uniq[0].querySelector(`[data-testid="${expectedAccent}"]`)) {
      out.accentWrongItem.push(`the red item is ${label(uniq[0])}, expected ${expectedAccent}`);
    }
  }
  // Any element carrying the .accent class but showing no accent color is a hidden extra.
  // (Checked through the count above.)

  // Media.
  for (const el of document.querySelectorAll('img, svg, canvas, picture, video, audio, iframe, object, embed, input[type="image"]')) out.media.push(`${label(el)} is present`);

  // Emoji and pictographs in text, attributes, and the title.
  const emoji = /\p{Extended_Pictographic}|\p{Emoji_Presentation}|️|⃣/u;
  const texts = [document.title];
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  for (let n = walker.nextNode(); n; n = walker.nextNode()) texts.push(n.textContent);
  for (const el of document.querySelectorAll('[aria-label],[placeholder],[title],[alt],[value]')) {
    for (const a of ['aria-label', 'placeholder', 'title', 'alt', 'value']) if (el.getAttribute(a)) texts.push(el.getAttribute(a));
  }
  for (const t of texts) if (emoji.test(t)) out.emoji.push(`pictographic character in "${t.trim().slice(0, 50)}"`);

  // Tabular lining numerals on numeric cells and vote counts.
  const numeric = [...document.querySelectorAll('[data-testid^="votecount-"], table td, table th')].filter((el) => visible(el) && /\d/.test(el.textContent));
  for (const el of numeric) {
    const cs = getComputedStyle(el);
    const vn = cs.fontVariantNumeric || '';
    const ff = cs.fontFeatureSettings || '';
    const tab = /tabular-nums/.test(vn) || /"tnum"/.test(ff);
    const lin = /lining-nums/.test(vn) || /"lnum"/.test(ff);
    if (!tab || !lin) out.tabularNumerals.push(`${label(el)} font-variant-numeric "${vn}" font-feature-settings "${ff}"`);
  }

  // Tap targets.
  const tapSel = 'a[href], button, input:not([type="hidden"]), select, textarea, summary, [role="button"], [role="link"], [tabindex]:not([tabindex="-1"])';
  for (const el of document.querySelectorAll(tapSel)) {
    if (!visible(el)) continue;
    const r = el.getBoundingClientRect();
    if (r.width < 43.5 || r.height < 43.5) out.tapTarget.push(`${label(el)} is ${Math.round(r.width)} by ${Math.round(r.height)} pixels`);
  }

  // No sideways page scroll.
  const de = document.documentElement;
  if (de.scrollWidth > window.innerWidth + 1) out.horizontalScroll.push(`page is ${de.scrollWidth}px wide in a ${window.innerWidth}px window`);

  return out;
}

export async function auditPage(page, { expectedAccent = null } = {}) {
  // Let fonts and layout settle so measurements are stable.
  await page.evaluate(() => document.fonts && document.fonts.ready).catch(() => {});
  await page.waitForTimeout(150);
  return page.evaluate(inPage, expectedAccent);
}

// Walks keyboard focus with Tab and checks the outline of every stop.
export async function auditFocus(page, maxStops = 60) {
  const problems = [];
  // In a modal dialog, start from the first control inside it, because Tab from the last
  // control of a dialog leaves the page.
  const inDialog = await page.evaluate(() => {
    document.activeElement?.blur?.();
    window.scrollTo(0, 0);
    const dlg = document.querySelector('dialog[open]');
    if (!dlg) return false;
    const first = dlg.querySelector('input, button, [tabindex]:not([tabindex="-1"])');
    if (first) first.focus();
    return !!first;
  });
  const seen = new Set();
  let stops = 0;
  for (let i = 0; i < maxStops; i++) {
    if (!(inDialog && i === 0)) await page.keyboard.press('Tab');
    const info = await page.evaluate(() => {
      const el = document.activeElement;
      if (!el || el === document.body || el === document.documentElement) return null;
      const cs = getComputedStyle(el);
      const r = el.getBoundingClientRect();
      const key = (el.getAttribute('data-testid') || '') + '|' + el.tagName + '|' + Math.round(r.x) + ',' + Math.round(r.y);
      const m = cs.outlineColor.match(/rgba?\(([^)]+)\)/);
      const c = m ? m[1].split(/[,\s/]+/).filter(Boolean).map(Number) : [0, 0, 0, 1];
      return {
        key, tag: el.tagName.toLowerCase(), testid: el.getAttribute('data-testid') || '',
        style: cs.outlineStyle, width: parseFloat(cs.outlineWidth), color: c, shadow: cs.boxShadow,
      };
    });
    if (!info) break; // focus left the page, the walk is complete
    if (seen.has(info.key)) break;
    seen.add(info.key);
    stops++;
    const name = `<${info.tag}${info.testid ? ` data-testid="${info.testid}"` : ''}>`;
    const [r, g, b, a = 1] = info.color;
    if (info.style !== 'solid') problems.push(`${name} focus outline style is "${info.style}", expected solid`);
    else if (!(info.width >= 2)) problems.push(`${name} focus outline is ${info.width}px wide, expected at least 2px`);
    else if (a < 0.9 || Math.max(r, g, b) > 70) problems.push(`${name} focus outline color rgba(${info.color.join(', ')}) is not black`);
    if (info.shadow !== 'none') problems.push(`${name} has a box-shadow while focused`);
  }
  return { problems, stops };
}

// Source grep: nothing may put user text into markup.
function walk(dir, out = []) {
  if (!existsSync(dir)) return out;
  for (const f of readdirSync(dir)) {
    const p = join(dir, f);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (/\.(js|html|css)$/.test(f)) out.push(p);
  }
  return out;
}

export function grepSource(root) {
  const files = [join(root, 'index.html'), ...walk(join(root, 'js')), ...walk(join(root, 'css'))].filter(existsSync);
  const problems = [];
  for (const file of files) {
    const src = readFileSync(file, 'utf8');
    const rel = file.slice(root.length + 1);
    if (/\.(js|html)$/.test(file)) {
      const sink = /(innerHTML|outerHTML)\s*(\+?=)(?!=)/g;
      for (let m; (m = sink.exec(src)); ) {
        const rest = src.slice(m.index + m[0].length, m.index + m[0].length + 600);
        const end = rest.indexOf(';');
        const rhs = (end === -1 ? rest : rest.slice(0, end)).trim();
        const staticLiteral = /^(['"`])((?:(?!\1)[^\\$])*)\1$/.test(rhs) && !rhs.includes('${');
        const line = src.slice(0, m.index).split('\n').length;
        if (!staticLiteral) problems.push(`${rel}:${line} assigns non-literal markup to ${m[1]}`);
      }
      for (const pat of [/insertAdjacentHTML\s*\(/g, /document\.write(ln)?\s*\(/g, /createContextualFragment\s*\(/g, /\bsetHTMLUnsafe\s*\(/g, /dangerouslySetInnerHTML/g]) {
        for (let m; (m = pat.exec(src)); ) problems.push(`${rel}:${src.slice(0, m.index).split('\n').length} uses ${m[0]}`);
      }
      // Inline event handler attributes and script URLs built into markup strings.
      for (let m; (m = /\son(click|error|load|change|input|submit)\s*=\s*["']/gi.exec(src)); ) { problems.push(`${rel}: inline ${m[0].trim()} handler in markup`); break; }
      for (const pat of [/<img[\s>]/i, /<svg[\s>]/i, /<canvas[\s>]/i]) {
        if (pat.test(src)) problems.push(`${rel} contains a ${pat.source.slice(1, 4)} tag, which the design forbids`);
      }
    }
  }
  return { files: files.map((f) => f.slice(root.length + 1)), problems };
}
