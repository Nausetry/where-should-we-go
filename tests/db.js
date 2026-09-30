// Boots an in-memory Postgres (PGlite), applies the Supabase-style prelude, then every migration in order.
import { PGlite } from '@electric-sql/pglite';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = join(import.meta.dirname, '..');
const dir = join(root, 'supabase', 'migrations');

export async function freshDb() {
  const db = new PGlite();
  await db.exec(readFileSync(join(import.meta.dirname, 'prelude.sql'), 'utf8'));
  const files = readdirSync(dir).filter((f) => f.endsWith('.sql')).sort();
  for (const f of files) await db.exec(readFileSync(join(dir, f), 'utf8'));
  return { db, applied: files };
}

const ROLES = new Set(['anon', 'authenticated', 'service_role', 'postgres']);

// Returns { query, exec } that run each call in its own transaction as the given role.
// claims: { sub, email } become request.jwt.claim.sub / request.jwt.claim.email.
export function asRole(db, role, claims = {}) {
  if (!ROLES.has(role)) throw new Error(`unknown role ${role}`);
  const run = (fn) =>
    db.transaction(async (tx) => {
      if (role !== 'postgres') await tx.exec(`set local role ${role}`);
      await tx.query("select set_config('request.jwt.claim.sub', $1, true), set_config('request.jwt.claim.email', $2, true)", [
        claims.sub ?? '',
        claims.email ?? '',
      ]);
      return fn(tx);
    });
  return {
    query: (sql, params) => run((tx) => tx.query(sql, params)),
    exec: (sql) => run((tx) => tx.exec(sql)),
  };
}
