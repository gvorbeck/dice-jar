// Character migration service for handling legacy data formats
import { EQUIPMENT_CATEGORIES, CURRENCY_TYPES } from '@/constants';
import { normalizeCurrency } from '@/utils/currency';
import type { Character } from '@/types';

import { SCHEMA_VERSION } from './documentSchemas';

// Migration step versions - keep these for historical migration logic
const VERSION_CUSTOM_CLASSES = 2.4; // Version when custom classes were refactored
const VERSION_CUSTOM_RACES = 2.5; // Version when custom races were refactored
const VERSION_COMBINATION_CLASSES = 2.6; // Version when combination classes became single class entities

/**
 * Written to settings.version beside schemaVersion: the previous build treats a character without it as legacy and rewrites its coins, so two builds would undo each other.
 * shortcut: the old field stays for one release; delete it (here, in saveCharacter and in the migration) once no tab on the previous build is left.
 */
export const OLD_BUILD_VERSION = VERSION_COMBINATION_CLASSES;

// Types for legacy character data
interface LegacyAbilities {
  modifiers?: Record<string, string>;
  scores?: Record<string, number>;
  [key: string]: unknown;
}

interface LegacyHp {
  points?: number;
  max?: number;
  desc?: string;
  current?: number;
  [key: string]: unknown;
}

interface LegacySettings {
  version?: number; // the old home of the schema version
  useCoinWeight?: boolean;
}

interface LegacyEquipmentItem {
  name?: string;
  costValue?: number;
  costCurrency?: string;
  weight?: number;
  category?: string;
  amount?: number;
  [key: string]: unknown;
}

interface LegacyCustomClass {
  name?: string;
  usesSpells?: boolean;
  hitDie?: string;
}

interface LegacyCustomRace {
  name?: string;
}

interface LegacyCharacterData {
  name?: string;
  race?: string;
  class?: string | string[];
  level?: number;
  xp?: number;
  abilities?: LegacyAbilities;
  gold?: number;
  silver?: number;
  copper?: number;
  electrum?: number;
  platinum?: number;
  hp?: LegacyHp;
  equipment?: LegacyEquipmentItem[];
  settings?: LegacySettings;
  schemaVersion?: number;
  useCoinWeight?: boolean;
  wearing?: boolean;
  customClasses?: Record<string, LegacyCustomClass>;
  customRace?: LegacyCustomRace;
  [key: string]: unknown;
}

const storedVersion = (data: LegacyCharacterData): number => data.schemaVersion ?? data.settings?.version ?? 0;

/** Whether a stored character differs from what is saved today: an old format, or only the version bookkeeping. */
export const needsMigration = (data: LegacyCharacterData): boolean =>
  isLegacyCharacter(data) ||
  !(storedVersion(data) >= SCHEMA_VERSION) ||
  data.settings?.version !== OLD_BUILD_VERSION ||
  Array.isArray(data['desc']);

/**
 * Type guard to check if character data is in legacy format
 */
function isLegacyCharacter(data: LegacyCharacterData): boolean {
  // Check for legacy format indicators
  const hasLegacyAbilities = Boolean(data['abilities']?.modifiers && data['abilities']?.scores);

  const hasLegacyCurrency = typeof data['gold'] === 'number' || typeof data['silver'] === 'number' || typeof data['copper'] === 'number';

  const hasLegacyHp = data['hp']?.points !== undefined;

  const hasLegacyClasses = hasLegacyClassNames(data);

  const hasReadMagicSpell = hasReadMagicInSpells(data);

  const hasCustomClassesProperty = typeof data['customClasses'] === 'object' && data['customClasses'] !== null;

  const hasCustomRaceProperty = typeof data['customRace'] === 'object' && data['customRace'] !== null;

  // Only a document older than the last format change goes through the legacy converter; one that merely lacks schemaVersion is current.
  const needsVersionUpdate = !(storedVersion(data) >= VERSION_COMBINATION_CLASSES);

  const hasArrayClass = Array.isArray(data['class']);

  return (
    hasLegacyAbilities ||
    hasLegacyCurrency ||
    hasLegacyHp ||
    hasLegacyClasses ||
    hasReadMagicSpell ||
    hasCustomClassesProperty ||
    hasCustomRaceProperty ||
    needsVersionUpdate ||
    hasArrayClass
  );
}

/**
 * Check if character has class names instead of proper class IDs
 */
function hasLegacyClassNames(data: LegacyCharacterData): boolean {
  const classes = Array.isArray(data.class) ? data.class : data.class ? [data.class] : [];

  // Check if any class has uppercase letters or spaces (indicating it's a name, not an ID)
  return classes.some((cls) => typeof cls === 'string' && (/[A-Z]/.test(cls) || /\s/.test(cls)));
}

/**
 * Check if character has Read Magic in their spells array (should be removed since it's auto-provided)
 */
function hasReadMagicInSpells(data: LegacyCharacterData): boolean {
  if (!Array.isArray(data['spells'])) return false;

  return data['spells'].some((spell: unknown) => spell && typeof spell === 'object' && 'name' in spell && spell.name === 'Read Magic');
}

/**
 * Convert class name to proper lowercase ID using standardized rules
 */
function convertClassToId(className: string): string {
  if (!className) return '';

  return className
    .toLowerCase()
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/[^a-z0-9-]/g, ''); // Remove any non-alphanumeric characters except hyphens
}

/**
 * Convert race name to proper lowercase ID using standardized rules
 */
function convertRaceToId(raceName: string): string {
  if (!raceName) return '';

  return raceName
    .toLowerCase()
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/[^a-z0-9-]/g, ''); // Remove any non-alphanumeric characters except hyphens
}

/**
 * Migrate legacy character data to current format
 */
function migrateLegacyCharacter(legacyData: LegacyCharacterData): LegacyCharacterData {
  const migrated = { ...legacyData };

  // Migrate abilities from separate modifiers/scores to combined structure
  if (legacyData['abilities']?.modifiers && legacyData['abilities']?.scores) {
    migrated['abilities'] = {};
    const abilityNames = ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'];

    for (const ability of abilityNames) {
      const score = legacyData['abilities']?.scores?.[ability] || 0;
      const modifierStr = legacyData['abilities']?.modifiers?.[ability] || '+0';
      const modifier = parseInt(modifierStr.replace('+', ''), 10) || 0;

      migrated['abilities'][ability] = {
        value: score,
        modifier: modifier,
      };
    }
  }

  // Migrate currency from separate properties to nested object, only when the old properties are there: a character that is merely
  // on an older version already holds its coins in `currency`, and rebuilding it from nothing would zero them.
  const currencyKeys = ['gold', 'silver', 'copper', 'electrum', 'platinum'] as const;
  if (currencyKeys.some((key) => typeof legacyData[key] === 'number')) {
    const currency: Record<string, number> = { gold: 0 };
    for (const key of currencyKeys) if (typeof legacyData[key] === 'number') currency[key] = legacyData[key];
    migrated['currency'] = currency;
  }
  for (const key of currencyKeys) delete migrated[key];

  // Migrate HP structure, from the old `points` form or when there is no current: a modern hp keeps its current hit points.
  if (legacyData['hp'] && (legacyData['hp'].points !== undefined || legacyData['hp'].current === undefined)) {
    migrated['hp'] = {
      current: legacyData['hp'].points ?? legacyData['hp'].max ?? 0,
      max: legacyData['hp'].max || 0,
      ...(legacyData['hp'].desc && { desc: legacyData['hp'].desc }),
    };
  }

  // Migrate equipment - ensure it's an array and has required properties
  if (!Array.isArray(migrated['equipment'])) {
    migrated['equipment'] = [];
  } else {
    // Standardize equipment entries
    migrated['equipment'] = migrated['equipment'].map((item: LegacyEquipmentItem) => ({
      name: item.name || 'Unknown Item',
      costValue: item.costValue || 0,
      costCurrency: item.costCurrency || CURRENCY_TYPES.GOLD,
      weight: item.weight || 0,
      category: item.category || EQUIPMENT_CATEGORIES.GENERAL,
      amount: item.amount || 1,
      ...item, // Preserve other properties
    }));
  }

  // Ensure required fields exist
  migrated['name'] = migrated['name'] || 'Unnamed Character';

  // Migrate race name to proper ID
  if (migrated['race']) {
    migrated['race'] = convertRaceToId(migrated['race']);
  } else {
    migrated['race'] = '';
  }

  // Migrate class names to proper IDs
  // Note: Old characters may have class as array, but we'll convert them in migrateCombinationClasses
  if (Array.isArray(migrated['class'])) {
    // Keep as array for now, will be converted in migrateCombinationClasses
    migrated['class'] = migrated['class'].map((className: string) => convertClassToId(className));
  } else {
    const singleClass = migrated['class'] || '';
    migrated['class'] = singleClass ? convertClassToId(singleClass) : '';
  }

  migrated['level'] = migrated['level'] || 1;
  migrated['xp'] = migrated['xp'] || 0;

  // Remove "Read Magic" from spells array since it's now automatically added for appropriate classes
  if (Array.isArray(migrated['spells'])) {
    migrated['spells'] = migrated['spells'].filter(
      (spell: unknown) => !(spell && typeof spell === 'object' && 'name' in spell && spell.name === 'Read Magic'),
    );
  }

  // Clean up fractional currency (version 2.3 migration)
  if (migrated['currency']) {
    migrated['currency'] = normalizeCurrency(
      migrated['currency'] as {
        gold: number;
        silver?: number;
        copper?: number;
        electrum?: number;
        platinum?: number;
      },
    );
  }

  // Preserve/create settings
  migrated['settings'] = {
    ...migrated['settings'],
    useCoinWeight: migrated['useCoinWeight'] || migrated['settings']?.useCoinWeight || false,
  };

  // Clean up legacy properties
  delete migrated['useCoinWeight'];
  delete migrated['wearing'];

  return migrated;
}

/**
 * Migrate character from version 2.4 to 2.5 (custom races refactor)
 */
function migrateCustomRaces(data: LegacyCharacterData): LegacyCharacterData {
  const migrated = { ...data };

  // If character has customRace property, migrate it to the new format
  if (data['customRace'] && typeof data['customRace'] === 'object') {
    const customRace = data['customRace'] as LegacyCustomRace;

    // If character race is "custom" and has a customRace.name, use the name directly as the race
    if (migrated['race'] === 'custom' && customRace.name) {
      migrated['race'] = customRace.name;
    }

    // Remove the customRace property
    delete migrated['customRace'];
  }

  return migrated;
}

/**
 * Migrate character from version 2.3 to 2.4 (custom classes refactor)
 */
function migrateCustomClasses(data: LegacyCharacterData): LegacyCharacterData {
  const migrated = { ...data };

  // If character has customClasses property, migrate it to the new format
  if (data['customClasses'] && typeof data['customClasses'] === 'object') {
    const customClasses = data['customClasses'] as Record<string, LegacyCustomClass>;

    // Get the first custom class (assuming single custom class for now)
    const customClassIds = Object.keys(customClasses);
    if (customClassIds.length > 0) {
      const firstCustomClassId = customClassIds[0];
      if (!firstCustomClassId) {
        return migrated;
      }

      const customClass = customClasses[firstCustomClassId];
      if (!customClass) {
        return migrated;
      }

      // Move the class name to the character.class field
      if (customClass.name) {
        migrated['class'] = customClass.name;
      }

      // Move the hit die to character.hp.die
      if (customClass.hitDie) {
        if (!migrated['hp']) {
          migrated['hp'] = { current: 0, max: 0 };
        }
        migrated['hp'] = {
          ...migrated['hp'],
          die: customClass.hitDie,
        };
      }
    }

    // Remove the customClasses property
    delete migrated['customClasses'];
  }

  return migrated;
}

/**
 * Migrate character from version 2.5 to 2.6 (combination classes refactor)
 * Convert class arrays to single combination class strings
 */
function migrateCombinationClasses(data: LegacyCharacterData): LegacyCharacterData {
  const migrated = { ...data };

  // If class is an array, convert to single string
  if (Array.isArray(migrated['class'])) {
    const classArray = migrated['class'] as string[];

    if (classArray.length === 2) {
      // Check for valid combination classes
      const sorted = [...classArray].sort();

      // Fighter + Magic-User = fighter-magic-user
      if (sorted[0] === 'fighter' && sorted[1] === 'magic-user') {
        migrated['class'] = 'fighter-magic-user';
      }
      // Magic-User + Thief = magic-user-thief
      else if (sorted[0] === 'magic-user' && sorted[1] === 'thief') {
        migrated['class'] = 'magic-user-thief';
      }
      // Invalid combination - keep first class
      else {
        migrated['class'] = classArray[0] || '';
        console.warn(`Invalid combination class ${JSON.stringify(classArray)}, using first class: ${classArray[0]}`);
      }
    } else if (classArray.length === 1) {
      // Single class in array, convert to string
      migrated['class'] = classArray[0] || '';
    } else if (classArray.length === 0) {
      // Empty array - set to empty string
      migrated['class'] = '';
      console.warn('Empty class array found, set to empty string');
    } else {
      // More than 2 classes - keep first class
      migrated['class'] = classArray[0] || '';
      console.warn(`Invalid class array with ${classArray.length} items, using first class: ${classArray[0]}`);
    }
  }

  return migrated;
}

/**
 * Process character data and migrate if necessary
 * @param data - Raw character data from import or storage (can be unknown type)
 * @throws Error if data is not a valid character structure
 */
export function processCharacterData(data: unknown): Character {
  // Type guard - ensure we have at least a character-like object
  if (typeof data !== 'object' || data === null) {
    throw new Error('Invalid character data: must be an object');
  }

  let migratedData = data as LegacyCharacterData;

  // The steps below key off the version the document was stored at, which the legacy conversion must not hide.
  let currentVersion = storedVersion(migratedData);
  if (isLegacyCharacter(migratedData)) {
    // First handle the main legacy migration (pre-2.3)
    migratedData = migrateLegacyCharacter(migratedData);
  }

  if (currentVersion < VERSION_CUSTOM_CLASSES) {
    migratedData = migrateCustomClasses(migratedData);
    currentVersion = VERSION_CUSTOM_CLASSES;
  }

  if (currentVersion < VERSION_CUSTOM_RACES) {
    migratedData = migrateCustomRaces(migratedData);
    currentVersion = VERSION_CUSTOM_RACES;
  }

  // ALWAYS run if class is still an array, regardless of version number
  if (currentVersion < VERSION_COMBINATION_CLASSES || Array.isArray(migratedData['class'])) {
    migratedData = migrateCombinationClasses(migratedData);
  }

  // The custom-class step can set a class name the legacy rules rewrite (to its ID); settle it now, so migrating the result again changes nothing.
  if (isLegacyCharacter(migratedData)) migratedData = migrateLegacyCharacter(migratedData);

  // Fields the sheet reads as numbers and lists: an old file that left them out still opens (and imports) with their empty values.
  migratedData['xp'] ??= 0;
  migratedData['equipment'] ??= [];
  migratedData['currency'] ??= { gold: 0 };
  // An older editor stored the description as a list of lines; the sheet shows and edits it as one text.
  if (Array.isArray(migratedData['desc'])) migratedData['desc'] = (migratedData['desc'] as unknown[]).map(String).join('\n');

  migratedData = { ...migratedData, schemaVersion: SCHEMA_VERSION, settings: { ...migratedData['settings'], version: OLD_BUILD_VERSION } };

  // After migration, legacy data should now conform to current Character interface
  // The migration functions ensure all required fields are present with proper defaults
  return migratedData as unknown as Character;
}
