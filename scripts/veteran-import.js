// scripts/veteran-import.js
//
// Converts a raw `veterans.json` export (from UmaExtractor / similar
// memory-reading tools) into the same record shape as `all_runners.json`,
// entirely in the browser. This lets people upload veterans.json directly
// instead of running a separate conversion script first.
//
// veterans.json only contains Cygames' internal numeric IDs (card_id,
// skill_id, factor_id, ...). The ID -> name lookup tables this module
// fetches from ./data/reference/ and the decoding rules below (spark ID
// ranges, unique-skill ID derivation, aptitude grade thresholds) are
// adapted from the openly-shared data files and enrichment logic in
// TheCing/uma-parent-viewer (https://github.com/TheCing/uma-parent-viewer),
// which itself credits TheCing/uma-tools and UmaTL/hachimi-tl-en as the
// original sources of the English names.
//
// This is community-datamined data, so it will drift out of date as new
// characters/skills/events are added. If a name shows up as a raw ID
// (e.g. "Skill #123456"), the fix is to refresh data/reference/*.json.

const REFERENCE_FILES = {
  overrides: './data/reference/overrides.json',
  gametoraSkills: './data/reference/gametora_skills.json',
  skillsGlobal: './data/reference/skillnames_global.json',
  skillsJp: './data/reference/skillnames_jp.json',
  skillData: './data/reference/skill_data.json',
  umasGlobal: './data/reference/umas_global.json',
  umasFull: './data/reference/umas_full.json',
  sparkNames: './data/reference/sparknames_global.json',
  raceNames: './data/reference/racenames_global.json',
  umamoeSkills: './data/reference/umamoe/skills.json',
  umamoeFactors: './data/reference/umamoe/factors.json',
  umamoeCharaNames: './data/reference/umamoe/character_names.json',
};

const UMAMOE_TYPE_TO_COLOR = { 0: 'blue', 1: 'pink', 2: 'white', 3: 'white', 4: 'white', 5: 'green', '-1': 'white' };

let referenceDataCache = null;

// Detects whether an uploaded array is a raw veterans.json export
// (ID-based, from UmaExtractor) rather than an already-converted
// all_runners.json (which this site's viewer normally expects).
export function isRawVeteranExport(data) {
  return (
    Array.isArray(data) &&
    data.length > 0 &&
    data[0] &&
    typeof data[0] === 'object' &&
    'trained_chara_id' in data[0]
  );
}

async function fetchJson(path) {
  try {
    const res = await fetch(path);
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
    return await res.json();
  } catch (err) {
    console.warn(`[veteran-import] Could not load ${path}: ${err.message}`);
    return {};
  }
}

async function loadReferenceData() {
  if (referenceDataCache) return referenceDataCache;

  const entries = Object.entries(REFERENCE_FILES);
  const results = await Promise.all(entries.map(([, path]) => fetchJson(path)));

  referenceDataCache = {};
  entries.forEach(([key], i) => {
    referenceDataCache[key] = results[i];
  });

  // uma.moe ships these as arrays; turn them into id-keyed lookup maps.
  const umamoeSkillsById = {};
  for (const s of Array.isArray(referenceDataCache.umamoeSkills) ? referenceDataCache.umamoeSkills : []) {
    if (s && s.skill_id != null && s.name) umamoeSkillsById[String(s.skill_id)] = s.name;
  }
  referenceDataCache.umamoeSkills = umamoeSkillsById;

  const umamoeFactorsById = {};
  for (const f of Array.isArray(referenceDataCache.umamoeFactors) ? referenceDataCache.umamoeFactors : []) {
    if (f && f.id != null) umamoeFactorsById[f.id] = f;
  }
  referenceDataCache.umamoeFactors = umamoeFactorsById;

  if (typeof referenceDataCache.umamoeCharaNames !== 'object' || referenceDataCache.umamoeCharaNames === null) {
    referenceDataCache.umamoeCharaNames = {};
  }

  return referenceDataCache;
}

// proper_* aptitude values are 1-8 and map directly onto the game's G-S
// letter grades.
function valueToGrade(value) {
  if (value === undefined || value === null) return 'G';
  if (value >= 8) return 'S';
  if (value === 7) return 'A';
  if (value === 6) return 'B';
  if (value === 5) return 'C';
  if (value === 4) return 'D';
  if (value === 3) return 'E';
  if (value === 2) return 'F';
  return 'G';
}

function unescapeHtml(str) {
  if (!str) return str;
  return str
    .replace(/&amp;/g, '&')
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

function getSkillName(ref, skillId) {
  const idStr = String(skillId);

  const override = (ref.overrides && ref.overrides.skills) ? ref.overrides.skills[idStr] : null;
  if (override) return override;

  // GameTora's community translation team tracks the game's actual global
  // localization closely, and testing showed it's consistently correct
  // where uma.moe's names sometimes aren't (e.g. skill 201113 - GameTora
  // correctly has "Refraction Arc", uma.moe has the JP-literal "Photon
  // Slash"). So it's checked right after manual overrides.
  const gametoraName = ref.gametoraSkills[idStr];
  if (gametoraName) return gametoraName;

  // skillsGlobal is a dedicated EN localization table and matches the
  // game's actual global names (and this site's own icon lookup table).
  // uma.moe's skills.json "name" field is sometimes a flavor/literal JP
  // translation instead (e.g. skill 201113 -> "Photon Slash" there, vs the
  // real global name "Refraction Arc") - so it's only used as a last resort
  // for IDs the older table doesn't have yet (very recently added skills).
  const entry = ref.skillsGlobal[idStr];
  if (Array.isArray(entry) && entry.length > 0) return entry[0];
  const jpEntry = ref.skillsJp[idStr];
  if (Array.isArray(jpEntry) && jpEntry.length > 1) return jpEntry[1];
  const umamoeName = ref.umamoeSkills[idStr];
  if (umamoeName) return unescapeHtml(umamoeName);
  return null;
}

function getCharaName(ref, cardId) {
  if (!cardId) return null;
  const charaId = String(Math.floor(cardId / 100));
  const umamoeEntry = ref.umamoeCharaNames[charaId];
  if (umamoeEntry && umamoeEntry.name) return umamoeEntry.name;
  for (const table of [ref.umasGlobal, ref.umasFull]) {
    const uma = table[charaId];
    if (uma) {
      const names = uma.name || ['', ''];
      return (names.length > 1 && names[1]) ? names[1] : names[0];
    }
  }
  return null;
}

const BLUE_STATS = { 1: 'Speed', 2: 'Stamina', 3: 'Power', 4: 'Guts', 5: 'Wit' };
const PINK_GROUND = { 11: 'Turf', 12: 'Dirt' };
const PINK_STYLE = { 21: 'Front Runner', 22: 'Pace Chaser', 23: 'Late Surger', 24: 'End Closer' };
const PINK_DISTANCE = { 31: 'Sprint', 32: 'Mile', 33: 'Medium', 34: 'Long' };

// Decodes a single factor_id into { color, spark_name, count }.
// Every spark ID is `base_id * 10 + star_count`. uma.moe's factors.json
// maps base_id -> {text, type} directly and is kept current with game
// updates, so it's tried first. Anything not yet in that curated list
// falls back to range-based decoding against the older TheCing tables
// (see module header for provenance).
function getSpark(ref, factorId) {
  const fid = Number(factorId);

  const baseId = Math.floor(fid / 10);
  const star = fid % 10;
  const umamoeEntry = ref.umamoeFactors[String(baseId)];
  if (umamoeEntry) {
    const color = UMAMOE_TYPE_TO_COLOR[umamoeEntry.type] || 'white';
    return { color, spark_name: umamoeEntry.text, count: star };
  }

  if (fid >= 100 && fid < 600) {
    const bucket = Math.floor(fid / 100);
    const stars = fid % 100;
    const name = BLUE_STATS[bucket];
    if (name) return { color: 'blue', spark_name: name, count: stars };
  }

  if (fid >= 1000 && fid < 5000) {
    const bucket = Math.floor(fid / 100);
    const stars = fid % 100;
    if (PINK_GROUND[bucket]) return { color: 'pink', spark_name: PINK_GROUND[bucket], count: stars };
    if (PINK_STYLE[bucket]) return { color: 'pink', spark_name: PINK_STYLE[bucket], count: stars };
    if (PINK_DISTANCE[bucket]) return { color: 'pink', spark_name: PINK_DISTANCE[bucket], count: stars };
  }

  // Green: unique-skill sparks. 8-digit ID: 10[chara_offset][variant][star]
  if (fid >= 10000000 && fid < 20000000) {
    const s = String(fid);
    if (s.length === 8) {
      const middle = parseInt(s.slice(2, 5), 10);
      const variant = parseInt(s[5], 10);
      const star = parseInt(s.slice(6, 8), 10);
      const skillId = (variant === 2 ? 110001 : 100001) + middle;
      const name = getSkillName(ref, skillId);
      if (name) return { color: 'green', spark_name: name, count: star };
    }
  }

  // White: skill sparks (200XXYY -> white/rarity=1 version of the skill group)
  if (fid >= 2000000 && fid < 3000000) {
    const star = fid % 100;
    const groupBase = Math.floor(fid / 100) * 10;
    for (let digit = 1; digit < 10; digit++) {
      const candidate = groupBase + digit;
      const entry = ref.skillData[String(candidate)];
      if (entry && entry.rarity === 1) {
        const name = getSkillName(ref, candidate);
        if (name) return { color: 'white', spark_name: name, count: star };
        break;
      }
    }
    for (let digit = 1; digit < 10; digit++) {
      const candidate = groupBase + digit;
      const name = getSkillName(ref, candidate);
      if (name) return { color: 'white', spark_name: name, count: star };
    }
  }

  // White: race-win sparks (100XXYY, 7 digits)
  if (fid >= 1000000 && fid < 10000000) {
    const star = fid % 100;
    const raceProgramId = Math.floor(fid / 100);
    const textRaceId = 1000 + (raceProgramId % 1000);
    const raceName = ref.raceNames[String(textRaceId)];
    if (raceName) return { color: 'white', spark_name: raceName, count: star };
  }

  // Fallback: flat lookup table covers scenario sparks and anything missed above.
  const flatName = ref.sparkNames[String(fid)];
  if (flatName) {
    const star = fid >= 100 ? fid % 100 : fid;
    return { color: 'white', spark_name: flatName, count: star };
  }

  return null;
}

function getSparksList(ref, factorInfoArray) {
  const sparks = [];
  for (const entry of factorInfoArray || []) {
    const spark = getSpark(ref, entry.factor_id);
    if (spark) sparks.push(spark);
  }
  return sparks;
}

function convertVeteran(ref, veteran) {
  const name = getCharaName(ref, veteran.card_id);
  if (!name) return null; // unresolvable card_id - skip rather than show raw IDs

  const trainedId = veteran.trained_chara_id;
  const entryHash = `veteran_${trainedId}`;

  const skills = (veteran.skill_array || []).map((skill) => {
    return getSkillName(ref, skill.skill_id) || `Skill #${skill.skill_id}`;
  });

  const succession = veteran.succession_chara_array || [];
  const parent1 = succession.find((p) => p.position_id === 10) || null;
  const parent2 = succession.find((p) => p.position_id === 20) || null;

  return {
    entry_id: String(trainedId),
    last_updated: veteran.create_time || new Date().toISOString().slice(0, 19).replace('T', ' '),
    entry_hash: entryHash,
    name,
    score: veteran.rank_score || 0,
    speed: veteran.speed || 0,
    stamina: veteran.stamina || 0,
    power: veteran.power || 0,
    guts: veteran.guts || 0,
    wit: veteran.wiz || 0,
    turf: valueToGrade(veteran.proper_ground_turf),
    dirt: valueToGrade(veteran.proper_ground_dirt),
    sprint: valueToGrade(veteran.proper_distance_short),
    mile: valueToGrade(veteran.proper_distance_mile),
    medium: valueToGrade(veteran.proper_distance_middle),
    long: valueToGrade(veteran.proper_distance_long),
    front: valueToGrade(veteran.proper_running_style_nige),
    pace: valueToGrade(veteran.proper_running_style_senko),
    late: valueToGrade(veteran.proper_running_style_sashi),
    end: valueToGrade(veteran.proper_running_style_oikomi),
    gp1: parent1 ? (getCharaName(ref, parent1.card_id) || 'Unknown') : 'Unknown',
    gp2: parent2 ? (getCharaName(ref, parent2.card_id) || 'Unknown') : 'Unknown',
    skills,
    sparks: {
      parent: getSparksList(ref, veteran.factor_info_array),
      gp1: parent1 ? getSparksList(ref, parent1.factor_info_array) : [],
      gp2: parent2 ? getSparksList(ref, parent2.factor_info_array) : [],
    },
  };
}

// Converts a full veterans.json array into all_runners.json-shaped records.
// Returns { records, skippedCount, totalCount }.
export async function convertVeteransToRunners(veterans) {
  const ref = await loadReferenceData();
  const records = [];
  let skipped = 0;

  for (const veteran of veterans) {
    const record = convertVeteran(ref, veteran);
    if (record) {
      records.push(record);
    } else {
      skipped++;
    }
  }

  return { records, skippedCount: skipped, totalCount: veterans.length };
}
