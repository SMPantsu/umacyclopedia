// test/run-conversion-test.js
//
// Regression test for scripts/veteran-import.js. Converts the fixture at
// test/fixtures/veterans-sample.json (a handful of real veteran records
// covering sparks, skills, and grandparents) and compares the result
// against the checked-in golden output at
// test/fixtures/expected-output.json.
//
// Run with: node test/run-conversion-test.js
//
// If a reference data file changes intentionally (e.g. after refreshing
// data/reference/*), regenerate the golden file with:
//   node test/run-conversion-test.js --update

import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..');

// veteran-import.js fetches reference files with relative paths like
// './data/reference/...'. Polyfill fetch to resolve those against the
// repo root and read them off disk instead of hitting the network.
const nodeFetch = globalThis.fetch;
globalThis.fetch = async (url) => {
  if (typeof url === 'string' && url.startsWith('./')) {
    const filePath = path.join(REPO_ROOT, url.slice(2));
    try {
      const text = await readFile(filePath, 'utf-8');
      return {
        ok: true,
        status: 200,
        statusText: 'OK',
        json: async () => JSON.parse(text),
      };
    } catch (err) {
      return { ok: false, status: 404, statusText: err.message };
    }
  }
  return nodeFetch(url);
};

const { convertVeteransToRunners } = await import('../scripts/veteran-import.js');

function deepEqual(a, b) {
  if (a === b) return true;
  if (typeof a !== typeof b) return false;
  if (a === null || b === null) return false;
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  if (typeof a === 'object') {
    const aKeys = Object.keys(a);
    const bKeys = Object.keys(b);
    if (aKeys.length !== bKeys.length) return false;
    return aKeys.every((k) => deepEqual(a[k], b[k]));
  }
  return false;
}

async function main() {
  const shouldUpdate = process.argv.includes('--update');

  const fixturePath = path.join(__dirname, 'fixtures/veterans-sample.json');
  const expectedPath = path.join(__dirname, 'fixtures/expected-output.json');

  const veterans = JSON.parse(await readFile(fixturePath, 'utf-8'));
  const result = await convertVeteransToRunners(veterans);

  if (shouldUpdate) {
    const { writeFile } = await import('node:fs/promises');
    await writeFile(expectedPath, JSON.stringify(result, null, 2) + '\n');
    console.log(`Wrote golden output for ${result.records.length} record(s) to ${expectedPath}`);
    return;
  }

  const expected = JSON.parse(await readFile(expectedPath, 'utf-8'));

  let failures = 0;

  if (result.totalCount !== expected.totalCount) {
    console.error(`FAIL: totalCount ${result.totalCount} !== expected ${expected.totalCount}`);
    failures++;
  }
  if (result.skippedCount !== expected.skippedCount) {
    console.error(`FAIL: skippedCount ${result.skippedCount} !== expected ${expected.skippedCount}`);
    failures++;
  }
  if (result.records.length !== expected.records.length) {
    console.error(`FAIL: got ${result.records.length} records, expected ${expected.records.length}`);
    failures++;
  }

  for (let i = 0; i < Math.min(result.records.length, expected.records.length); i++) {
    const got = result.records[i];
    const exp = expected.records[i];
    if (!deepEqual(got, exp)) {
      console.error(`FAIL: record ${i} (${exp.name || got.name}) does not match golden output`);
      console.error('  Got:      ' + JSON.stringify(got));
      console.error('  Expected: ' + JSON.stringify(exp));
      failures++;
    }
  }

  // Guard against a raw-ID fallback silently regressing to "unknown skill"
  // for any skill in the fixture (the failure mode this whole test exists
  // to catch - see data/reference/README.md).
  for (const record of result.records) {
    for (const skill of record.skills) {
      if (/^Skill #\d+$/.test(skill)) {
        console.error(`FAIL: unresolved skill name "${skill}" in record ${record.name} - a reference table regressed`);
        failures++;
      }
    }
  }

  if (failures > 0) {
    console.error(`\n${failures} failure(s).`);
    process.exit(1);
  }

  console.log(`OK: ${result.records.length} record(s) matched golden output.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
