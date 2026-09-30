// Loads .env into process.env without printing anything. Safe to import many times.
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const file = join(import.meta.dirname, '..', '..', '.env');
if (existsSync(file)) {
  for (const line of readFileSync(file, 'utf8').split('\n')) {
    const m = line.match(/^([A-Z_]+)=(.*)$/);
    if (m && !(m[1] in process.env)) process.env[m[1]] = m[2];
  }
}

export const SUPABASE_URL = process.env.SUPABASE_URL;
export const SUPABASE_PUBLISHABLE_KEY = process.env.SUPABASE_PUBLISHABLE_KEY;
export const TEST_PREFIX = 'ZZ-TEST';
