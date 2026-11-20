/**
 * Sample game data for mock mode
 * Provides demonstration game sessions for contributors and demos
 */

import type { Game } from '@/types';

/**
 * Pre-built sample games showcasing different scenarios
 */
const SAMPLE_GAMES: Game[] = [
  {
    id: 'sample-tavern-mystery',
    name: 'The Tavern Mystery',
    notes:
      'A classic murder mystery set in the Silver Goblet tavern. The party must investigate the death of a wealthy merchant while dealing with suspicious patrons and hidden motives.',
    players: [
      {
        character: 'thorin-ironforge',
        characterName: 'Thorin Ironforge',
        user: 'mock-user',
        userName: 'Game Master',
        avatar: '🛡️',
      },
      {
        character: 'elara-moonwhisper',
        characterName: 'Elara Moonwhisper',
        user: 'mock-user',
        userName: 'Game Master',
        avatar: '🔮',
      },
      {
        character: 'pip-lightfinger',
        characterName: 'Pip Lightfinger',
        user: 'mock-user',
        userName: 'Game Master',
        avatar: '🗡️',
      },
    ],
    combatants: [
      {
        name: 'Suspicious Barkeep',
        ac: 9,
        initiative: 12,
        avatar: '🍺',
      },
      {
        name: 'Town Guard Captain',
        ac: 4,
        initiative: 8,
        avatar: '⚔️',
      },
      {
        name: 'Mysterious Stranger',
        ac: 6,
        initiative: 15,
        avatar: '🎭',
      },
    ],
  },

  {
    id: 'sample-dungeon-crawl',
    name: 'Ruins of the Ancient Temple',
    notes:
      'A classic dungeon crawl through the abandoned Temple of the Sun God. Features traps, puzzles, undead guardians, and a powerful lich in the final chamber.',
    players: [
      {
        character: 'brother-marcus',
        characterName: 'Brother Marcus',
        user: 'mock-user',
        userName: 'Game Master',
        avatar: '⚡',
      },
      {
        character: 'silvyr-dualwield',
        characterName: 'Silvyr Dualwield',
        user: 'mock-user',
        userName: 'Game Master',
        avatar: '🎯',
      },
    ],
    combatants: [
      {
        name: 'Skeleton Warrior',
        ac: 7,
        initiative: 6,
        avatar: '💀',
      },
      {
        name: 'Skeleton Warrior',
        ac: 7,
        initiative: 4,
        avatar: '💀',
      },
      {
        name: 'Zombie',
        ac: 8,
        initiative: 2,
        avatar: '🧟',
      },
      {
        name: 'Temple Guardian',
        ac: 2,
        initiative: 10,
        avatar: '🗿',
      },
      {
        name: 'Ancient Lich',
        ac: 0,
        initiative: 18,
        avatar: '👻',
      },
    ],
  },

  {
    id: 'sample-wilderness-adventure',
    name: 'Journey to Dragonspear Castle',
    notes:
      'An overland adventure through the dangerous Reaching Woods. The party must escort a merchant caravan while dealing with bandits, wild animals, and rumors of dragon sightings.',
    players: [
      {
        character: 'thorin-ironforge',
        characterName: 'Thorin Ironforge',
        user: 'mock-user',
        userName: 'Game Master',
        avatar: '🛡️',
      },
      {
        character: 'pip-lightfinger',
        characterName: 'Pip Lightfinger',
        user: 'mock-user',
        userName: 'Game Master',
        avatar: '🗡️',
      },
    ],
    combatants: [
      {
        name: 'Bandit Leader',
        ac: 5,
        initiative: 14,
        avatar: '🏹',
      },
      {
        name: 'Bandit',
        ac: 7,
        initiative: 11,
        avatar: '🗡️',
      },
      {
        name: 'Bandit',
        ac: 7,
        initiative: 9,
        avatar: '🗡️',
      },
      {
        name: 'Wolf',
        ac: 7,
        initiative: 16,
        avatar: '🐺',
      },
      {
        name: 'Wolf',
        ac: 7,
        initiative: 13,
        avatar: '🐺',
      },
      {
        name: 'Dire Wolf',
        ac: 6,
        initiative: 17,
        avatar: '🐺',
      },
    ],
  },

  {
    id: 'sample-urban-intrigue',
    name: 'Conspiracy in Waterdeep',
    notes:
      "A political intrigue adventure in the great city of Waterdeep. The party must navigate noble houses, guild politics, and secret societies to uncover a plot against the city's rulers.",
    players: [
      {
        character: 'elara-moonwhisper',
        characterName: 'Elara Moonwhisper',
        user: 'mock-user',
        userName: 'Game Master',
        avatar: '🔮',
      },
      {
        character: 'silvyr-dualwield',
        characterName: 'Silvyr Dualwield',
        user: 'mock-user',
        userName: 'Game Master',
        avatar: '🎯',
      },
    ],
    combatants: [
      {
        name: 'Noble Guard',
        ac: 4,
        initiative: 12,
        avatar: '⚔️',
      },
      {
        name: 'Guild Assassin',
        ac: 5,
        initiative: 18,
        avatar: '🗡️',
      },
      {
        name: 'Corrupt Magistrate',
        ac: 9,
        initiative: 3,
        avatar: '👨‍⚖️',
      },
      {
        name: 'Cult Fanatic',
        ac: 6,
        initiative: 14,
        avatar: '🔥',
      },
    ],
  },

  {
    id: 'sample-empty-game',
    name: 'New Campaign',
    notes: 'A fresh campaign ready for your next adventure. Add players and setup your first encounter!',
    players: [],
    combatants: [],
  },
];

/**
 * Get all sample games with fresh IDs for mock persistence
 */
export const getAllSampleGames = (): Game[] => {
  return SAMPLE_GAMES;
};
