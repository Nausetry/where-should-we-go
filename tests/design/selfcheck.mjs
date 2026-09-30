// Proves the audit catches violations: injects known bad markup and prints what was found.
import { chromium } from '@playwright/test';
import { auditPage } from './audit.js';
const b = await chromium.launch();
const p = await b.newPage();
await p.goto('http://localhost:4173/');
await p.waitForSelector('[data-testid=trip-name]');
await p.evaluate(() => {
  const d = document.createElement('div');
  d.innerHTML = '<p style="color:#8B1A1A">red extra</p><p class="x" style="box-shadow:0 1px 2px #000;background:#eee;border-left:1px solid #000;color:#0000ee">bad</p><img alt="" width="5" height="5"><svg width="3" height="3"></svg><p style="font-family:Arial,sans-serif;color:#ccc">gray sans 🙂</p><a href="#" style="font-size:12px">tiny</a><p style="background-image:linear-gradient(red,blue)">g</p>';
  document.querySelector('main').appendChild(d);
});
const a = await auditPage(p, { expectedAccent: 'review-button' });
for (const [k, v] of Object.entries(a)) console.log(k, v.length, v[0] || '');
await b.close();
