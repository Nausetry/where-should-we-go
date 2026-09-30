// Command line sweeper: node tests/helpers/sweep.js [--all]
// Deletes ZZ-TEST trips. Without --all, only those older than 5 minutes.
import { sweepStragglers } from './api.js';
const all = process.argv.includes('--all');
const n = await sweepStragglers(all ? 0 : 5 * 60 * 1000);
console.log(`Deleted ${n} ZZ-TEST trip(s).`);
