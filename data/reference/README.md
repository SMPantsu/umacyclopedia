# Reference data (ID → name lookups)

`veterans.json` (exported by [UmaExtractor](https://github.com/xancia/UmaExtractor))
only contains Cygames' internal numeric IDs — `card_id`, `skill_id`,
`factor_id`, etc. These files translate those IDs into the English names
used in `all_runners.json`.

## Lookup order (highest priority first)

1. **`overrides.json`** — manual corrections. Always checked first.
2. **`gametora_skills.json`** — skill names only, sourced from GameTora
   (see below). Consistently the most accurate for official global names.
3. **`umamoe/`** — uma.moe's live game data (characters, sparks, and a
   skill fallback).
4. **The older TheCing tables** — broader historical coverage, used as a
   final fallback.

### `overrides.json` (highest priority — edit this one directly for quick fixes)

A small hand-maintained file for cases where none of the automated
sources have the right text. Format:
```json
{ "skills": { "202282": "Full Tilt" } }
```
Add entries here as they're spotted; no code changes needed.

### `gametora_skills.json` (skill names — trust this over uma.moe's names)

Extracted from **[GameTora's](https://gametora.com/umamusume/skills)**
skill database, via the copy bundled in
**[daftuyda/UmaTools](https://github.com/daftuyda/UmaTools)**
(`assets/skills_all.json`, `name_en` field). GameTora runs a dedicated
translation effort that tracks the actual official global localization
closely. In testing, this caught every mismatch we found in uma.moe's
names (uma.moe's `skills.json` has a separate `enname` field that's
often a more literal/JP-derived translation instead of the official one -
e.g. skill 201113 is "Refraction Arc" officially, but uma.moe's `enname`
for it is "Photon Slash"). To refresh: re-pull `assets/skills_all.json`
from that repo (or GameTora directly, if you find a more current source)
and rebuild the trimmed `id -> name_en` map the same way.

### `umamoe/`

Pulled directly from **[uma-moe/umamoe-frontend](https://github.com/uma-moe/umamoe-frontend)**
(the source for [uma.moe](https://uma.moe)):

| File | What it maps |
|---|---|
| `character_names.json` | `chara_id` → character name |
| `skills.json` | `skill_id` → skill name (fallback only now - see above) |
| `factors.json` | spark `base_id` (i.e. `factor_id // 10`) → spark name + color type |

Still the primary source for character names and spark/factor names,
since no accuracy issues have shown up there. Static data shipped in
their public frontend repo, not a private API - no API key needed.

### Fallback tables (`skillnames_global.json`, `skillnames_jp.json`, `skill_data.json`, `umas_global.json`, `umas_full.json`, `sparknames_global.json`, `racenames_global.json`, `nicknames_global.json`)

Community-datamined tables sourced from
**[TheCing/uma-parent-viewer](https://github.com/TheCing/uma-parent-viewer)**,
which itself credits:

- [TheCing/uma-tools](https://github.com/TheCing/uma-tools) — skill/character names
- [UmaTL/hachimi-tl-en](https://github.com/UmaTL/hachimi-tl-en) — text translations

These cover some older/internal IDs the other sources don't include
(e.g. certain 900xxx-range skill variants), so they're kept as a
safety net rather than replaced outright.

## Keeping this up to date

The game adds new characters, skills, and events regularly. When
`veteran_loader.py` (or the in-browser version) logs a skipped entry, or
you see a wrong/missing name in the UI, work through the sources in
priority order above - GameTora's skill data first, then uma.moe, then
the older fallback tables. If none of them have the right text, add a
one-line entry to `overrides.json` and move on; it's meant to be a quick
patch, not something that needs a "proper" upstream fix.
