/**
 * Barrel file for all TypeScript types
 *
 * This file re-exports all types from their respective modules,
 * allowing imports like: import { CurrencyKey, Character } from '@/types'
 * instead of: import { CurrencyKey } from '@/types/game'
 */

// Character types
export type {
  AbilityScore,
  Spell,
  Cantrip,
  ScrollCreationProject,
  Character,
  RaceRequirement,
  SpecialAbility,
  Race,
  Class,
  BaseStepProps,
  SkillKey,
  SkillClassKey,
  TwoHPClass,
  SpellSystemType,
  RacialModificationInfo,
  HPGainResult,
} from './character';

// Game and currency types
export type {
  GameCombatant,
  GamePlayer,
  Game,
  CurrencyKey,
  CurrencyType,
  TreasureTypeConfig,
  CoinConfig,
  DiceResult,
  CombatCharacterData,
  CombatantHP,
  CombatantWithInitiative,
  TreasureResult,
  TreasureType,
  LairTreasureType,
  IndividualTreasureType,
  UnguardedTreasureLevel,
  SkillTableRow,
  ClassSkillData,
} from './game';

// UI types
export type { BaseButtonProps, UseLoadingStateOptions, LoadingState, ShowNotificationOptions, NotificationSystem } from './ui';

// Encounter types
export type { EncounterType, CityType, DungeonLevel, WildernessType } from './encounters';

// Configuration types
export type { ServiceErrorOptions } from './config';

// Spell types
export type { SpellWithCategory, SpellTypeInfo } from './spells';

// Monster types
export type { MonsterStats, Monster, MonsterWithCategory } from './monsters';

// Validation types
export type { CharacterValidationPipeline } from './validation';

// Equipment types
export type { Equipment, EquipmentPack, PackApplicationResult, RestrictionData, RestrictionResult } from './equipment';
