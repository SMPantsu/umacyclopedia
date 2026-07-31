// scripts/refresh-gametora-skills.mjs
//
// Regenerates data/reference/gametora_skills.json from
// daftuyda/UmaTools' assets/skills_all.json (id -> name_en), the same
// source it was originally built from (see data/reference/README.md).
//
// Run manually with: node scripts/refresh-gametora-skills.mjs
// Also runs on a monthly schedule via .github/workflows/refresh-gametora-skills.yml,
// which opens a PR if the data actually changed.

import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_PATH = path.join(__dirname, '../data/reference/gametora_skills.json');
const SOURCE_URL = 'https://raw.githubusercontent.com/daftuyda/UmaTools/main/assets/skills_all.json';

async function main() {
  const res = await fetch(SOURCE_URL);
  if (!res.ok) {
    throw new Error(`Failed to fetch ${SOURCE_URL}: ${res.status} ${res.statusText}`);
  }
  const skills = await res.json();

  const map = {};
  for (const skill of skills) {
    if (skill && skill.id != null && skill.name_en) {
      map[String(skill.id)] = skill.name_en;
    }
  }

  const before = JSON.parse(await readFile(OUTPUT_PATH, 'utf-8'));
  const beforeCount = Object.keys(before).length;
  const afterCount = Object.keys(map).length;

  const lines = Object.entries(map).map(([id, name]) => `${JSON.stringify(id)}: ${JSON.stringify(name)}`);
  const output = `{\n${lines.join(',\n')}\n}\n`;
  await writeFile(OUTPUT_PATH, output);

  console.log(`Refreshed gametora_skills.json: ${beforeCount} -> ${afterCount} entries.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
