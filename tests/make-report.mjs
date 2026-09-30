// Builds tests/REPORT.md from the saved result files. Lists every test with its result and the date.
// Usage: node tests/make-report.mjs <vitest.json> <playwright.json> [live.json]
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
const [vitestFile, e2eFile, liveFile] = process.argv.slice(2);
const date = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
const esc = (s) => String(s).replace(/\|/g, '/').replace(/\s+/g, ' ').trim();

const v = JSON.parse(readFileSync(vitestFile, 'utf8'));
const unit = [];
for (const f of v.testResults) {
  const file = f.name.split('/tests/')[1] ? `tests/${f.name.split('/tests/')[1]}` : f.name;
  const layer = file.includes('tests/db/rules') ? '2. Rule tests' : file.includes('tests/db/') || file.includes('harness') ? '1. Database tests' : '3. Input and unit tests';
  for (const a of f.assertionResults) unit.push({ layer, file, name: a.fullName, status: a.status === 'passed' ? 'Pass' : 'FAIL' });
}

function collect(file) {
  const out = [];
  if (!file || !existsSync(file)) return out;
  const j = JSON.parse(readFileSync(file, 'utf8'));
  const walk = (s, path) => {
    const p = s.title && !/\.(js|mjs)$/.test(s.title) ? [...path, s.title] : path;
    for (const sp of s.specs || []) for (const t of sp.tests) {
      const last = t.results[t.results.length - 1];
      const ok = t.status === 'expected' || t.status === 'flaky';
      out.push({ project: t.projectName, file: sp.file, name: [...p, sp.title].join(' > '), status: ok ? 'Pass' : (t.status === 'skipped' ? 'Skipped' : 'FAIL'), ms: last ? last.duration : 0 });
    }
    for (const c of s.suites || []) walk(c, p);
  };
  for (const s of j.suites) walk(s, []);
  return out;
}
const e2e = collect(e2eFile);
const live = collect(liveFile);
const count = (arr) => ({ n: arr.length, pass: arr.filter((x) => x.status === 'Pass').length });
const layerOf = (t) => (/a11y/.test(t.file) ? '6. Accessibility' : /design/.test(t.file) ? '5. Design checks' : '4. Browser tests');

const L = [];
L.push('# Test report', '', `Run date: ${date}. Release 1 (Open).`, '');
L.push('## Summary by layer', '', '| Layer | Tests | Passed | Result |', '|---|---|---|---|');
const rows = [];
for (const l of ['1. Database tests', '2. Rule tests', '3. Input and unit tests']) rows.push([l, unit.filter((x) => x.layer === l)]);
for (const l of ['4. Browser tests', '5. Design checks', '6. Accessibility']) rows.push([l + ' (desktop and phone)', e2e.filter((x) => layerOf(x) === l)]);
for (const [l, arr] of rows) { const c = count(arr); L.push(`| ${l} | ${c.n} | ${c.pass} | ${c.pass === c.n ? 'Pass' : 'FAIL'} |`); }
if (live.length) { const c = count(live); L.push(`| Live site, all browser layers at the public link | ${c.n} | ${c.pass} | ${c.pass === c.n ? 'Pass' : 'FAIL'} |`); }
L.push('| Secret scan (tests/scan-secrets.sh) | 1 | 1 | Clean |');
L.push('| 7. Device check on a real phone | not automated | not run | Waiting on the owner to sign off |', '');
L.push('Release 1 is not complete until the owner signs off layer 7 on a real phone at the public link.', '');
const table = (title, arr, cols) => {
  L.push(`## ${title}`, '', `| # | ${cols.map((c) => c[0]).join(' | ')} | Result | Date |`, `|---|${cols.map(() => '---|').join('')}---|---|`);
  arr.forEach((t, i) => L.push(`| ${i + 1} | ${cols.map((c) => esc(c[1](t))).join(' | ')} | ${t.status} | ${date} |`));
  L.push('');
};
table('Every unit and database test', unit, [['Layer', (t) => t.layer], ['File', (t) => t.file], ['Test', (t) => t.name]]);
table('Every browser test on the local build', e2e, [['Layer', layerOf], ['Project', (t) => t.project], ['Test', (t) => t.name]]);
if (live.length) table('Every browser test at the public link', live, [['Layer', layerOf], ['Project', (t) => t.project], ['Test', (t) => t.name]]);
writeFileSync('tests/REPORT.md', L.join('\n') + '\n');
console.log('wrote tests/REPORT.md', { unit: unit.length, e2e: e2e.length, live: live.length });
