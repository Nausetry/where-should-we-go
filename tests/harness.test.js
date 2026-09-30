import { test, expect } from 'vitest';
import { freshDb } from './db.js';

test('T-M0-1 harness boots a database and applies all migrations', async () => {
  const { db, applied } = await freshDb();
  const r = await db.query('select 1 as one');
  expect(r.rows[0].one).toBe(1);
  expect(Array.isArray(applied)).toBe(true);
});
