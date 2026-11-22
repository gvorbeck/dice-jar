import { useMemo } from 'react';
import { useDataResolver } from '../queries/useDataResolver';
import type { CharacterListItem } from '@/services';
import type { Game } from '@/types';

interface UsePlayerCharactersReturn {
  playerCharacters: CharacterListItem[];
  loading: boolean;
  error: string | null;
}

/**
 * Custom hook to fetch player character data for a game
 * Uses TanStack Query-based useDataResolver for caching and batch fetching
 */
export const usePlayerCharacters = (game: Game): UsePlayerCharactersReturn => {
  // Prepare data requests for all players
  const playerRequests =
    game?.players?.map((player) => ({
      userId: player.user,
      characterId: player.character,
    })) || [];

  // Use TanStack Query to resolve player data
  const { getResolvedData, isLoading, hasError } = useDataResolver(playerRequests);

  // Transform resolved data to match CharacterListItem interface
  const gamePlayers = game?.players;

  const playerCharacters = useMemo(() => {
    if (!gamePlayers?.length) return [];

    const characters: CharacterListItem[] = gamePlayers.map((player) => {
      const resolved = getResolvedData(player.user, player.character);

      const character: CharacterListItem = {
        id: player.character,
        name: resolved?.characterName || player.character,
        ...(resolved?.race && { race: resolved.race }),
        ...(resolved?.class && { class: resolved.class }),
        ...(resolved?.level && { level: resolved.level }),
        ...(resolved?.hasTurnUndead !== undefined && {
          hasTurnUndead: resolved.hasTurnUndead,
        }),
      };

      return character;
    });

    return characters;
  }, [gamePlayers, getResolvedData]);

  return {
    playerCharacters,
    loading: isLoading,
    error: hasError ? 'Failed to load player character data' : null,
  };
};
