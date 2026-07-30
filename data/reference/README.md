# Reference data (ID → name lookups)

`veterans.json` (exported by [UmaExtractor](https://github.com/xancia/UmaExtractor))
only contains Cygames' internal numeric IDs — `card_id`, `skill_id`,
`factor_id`, etc. These files translate those IDs into the English names
used in `all_runners.json`.

| File | What it maps |
|---|---|
| `umas_global.json` / `umas_full.json` | `chara_id` → character name, `card_id` → outfit name |
| `skillnames_global.json` / `skillnames_jp.json` | `skill_id` → skill name |
| `skill_data.json` | `skill_id` → rarity/effects (used to find the "white" version of a skill group for spark decoding) |
| `sparknames_global.json` | flat fallback table for spark/factor IDs |
| `racenames_global.json` | race program ID → race name (used to decode race-win sparks) |
| `nicknames_global.json` | epithet/nickname ID → name (not currently used in `all_runners.json`, kept for future use) |

## Where this data comes from

These are community-datamined tables, not something this repo generates.
They were sourced from **[TheCing/uma-parent-viewer](https://github.com/TheCing/uma-parent-viewer)**,
which itself credits:

- [TheCing/uma-tools](https://github.com/TheCing/uma-tools) — skill/character names
- [UmaTL/hachimi-tl-en](https://github.com/UmaTL/hachimi-tl-en) — text translations

## Keeping this up to date

The game adds new characters, skills, and events regularly. When `veteran_loader.py`
logs a skipped entry or you see a raw ID show up instead of a name (e.g.
`"Skill #123456"`), it means these files are behind. To refresh them:

1. Go to one of the projects above and grab the latest `data/*.json` files, **or**
2. Run their `generate_data.py` yourself if you want to regenerate from source.

Then just overwrite the files in this folder — `veteran_loader.py` doesn't
need any code changes, it reads whatever is here.
