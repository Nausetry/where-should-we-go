// The design checks live in tests/design/ (contract section 6). playwright.config.js only scans
// tests/e2e, so this file loads them into the run.
import '../design/design-suite.js';
