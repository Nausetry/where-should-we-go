// Screenshots of the live site. Usage: BASE_URL=... node tests/live-shots/shots.mjs
import { chromium, devices } from '@playwright/test';
import { readFileSync } from 'node:fs';
for (const l of readFileSync('.env', 'utf8').split('\n')) { const m = l.match(/^([A-Z_]+)=(.*)$/); if (m && !(m[1] in process.env)) process.env[m[1]] = m[2]; }
const { createTestTrip, addVoter, closeTrip, deleteTripQuietly } = await import('../helpers/api.js');
const { createViaUi, openTrip, joinAs, vote, T } = await import('../helpers/ui.js');
const base = process.env.BASE_URL;
const b = await chromium.launch();
const out = 'tests/live-shots';
const made = [];
for (const [name, dev] of [['desktop', devices['Desktop Chrome']], ['phone', devices['Pixel 7']]]) {
  const ctx = await b.newContext({ ...dev, baseURL: base });
  const page = await ctx.newPage();
  await page.goto('./'); await page.waitForLoadState('networkidle');
  await page.screenshot({ path: `${out}/${name}-create.png`, fullPage: true });
  const t = await createTestTrip({ label: 'Shots', size: 3, activities: 6 });
  made.push(t);
  await addVoter(t.id, 'Ann Able', [t.activities[0].activity_id, t.activities[1].activity_id]);
  await openTrip(page, t.id);
  await joinAs(page, 'Pat Jones');
  await vote(page, t.activities[1].activity_id);
  await page.screenshot({ path: `${out}/${name}-trip-open.png`, fullPage: true });
  await closeTrip(t.id);
  await page.reload(); await page.getByTestId('confirmed-statement').waitFor({ timeout: 20000 });
  await page.screenshot({ path: `${out}/${name}-trip-confirmed.png`, fullPage: true });
  await ctx.close();
}
for (const t of made) await deleteTripQuietly(t.id, t.name).catch(() => {});
await b.close();
