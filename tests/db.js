// Boots an in-memory Postgres (PGlite) and applies every migration in order.
import { PGlite } from '@electric-sql/pglite';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const dir = join(import.meta.dirname, '..', 'supabase', 'migrations');

export async function freshDb() {
  const db = new PGlite();
  const files = readdirSync(dir).filter((f) => f.endsWith('.sql')).sort();
  for (const f of files) await db.exec(readFileSync(join(dir, f), 'utf8'));
  return { db, applied: files };
}
