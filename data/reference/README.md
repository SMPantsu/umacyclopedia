# Reference data (ID → name lookups)

`veterans.json` (exported by [UmaExtractor](https://github.com/xancia/UmaExtractor))
only contains Cygames' internal numeric IDs — `card_id`, `skill_id`,
`factor_id`, etc. These files translate those IDs into the English names
used in `all_runners.json`.

## Two layers, newest data wins

The loader checks `data/reference/umamoe/` **first**, and only falls back
to the older tables below it if uma.moe doesn't have an entry yet. This
keeps names current without needing everything to come from one place.

### `data/reference/umamoe/` (primary — refresh this one most often)

Pulled directly from **[uma-moe/umamoe-frontend](https://github.com/uma-moe/umamoe-frontend)**
(the source for [uma.moe](https://uma.moe)), specifically:

| File | What it maps |
|---|---|
| `character_names.json` | `chara_id` → character name |
| `skills.json` | `skill_id` → skill name |
| `factors.json` | spark `base_id` (i.e. `factor_id // 10`) → spark name + color type |

This is a static data file shipped in their public frontend repo, not a
private API — no API key or auth needed, just re-download the files.
Since it's what powers their live site, it tends to get updated quickly
after game patches.

### `skillnames_global.json`, `skillnames_jp.json`, `skill_data.json`, `umas_global.json`, `umas_full.json`, `sparknames_global.json`, `racenames_global.json`, `nicknames_global.json` (fallback)

Community-datamined tables sourced from
**[TheCing/uma-parent-viewer](https://github.com/TheCing/uma-parent-viewer)**,
which itself credits:

- [TheCing/uma-tools](https://github.com/TheCing/uma-tools) — skill/character names
- [UmaTL/hachimi-tl-en](https://github.com/UmaTL/hachimi-tl-en) — text translations

These cover some older/internal IDs uma.moe's curated lists don't include
(e.g. certain 900xxx-range skill variants), so they're kept as a
safety net rather than replaced outright.

## Keeping this up to date

The game adds new characters, skills, and events regularly. When
`veteran_loader.py` (or the in-browser version) logs a skipped entry, or
you see a raw ID show up instead of a name (e.g. `"Skill #123456"`), the
reference data is behind. To refresh it:

1. **First choice — update the `umamoe/` folder**, since it's the one
   most likely to already have the new content:
   - `character_names.json`, `skills.json`, `factors.json` from
     [uma-moe/umamoe-frontend](https://github.com/uma-moe/umamoe-frontend/tree/main/src/data)
2. If something's still missing after that, refresh the fallback tables
   from [TheCing/uma-parent-viewer](https://github.com/TheCing/uma-parent-viewer/tree/master/data)
   the same way.

Either way, just overwrite the files in place — no code changes needed,
the loader reads whatever's there.
