import { useEffect, useMemo, useRef, useState } from 'react';
import { hasTurnUndeadAbility } from '@/utils';
import { getCharacterById } from '@/services';
import type { Character } from '@/types';

interface DataRequest {
  userId: string;
  characterId: string;
}

interface ResolvedData {
  characterName?: string | undefined;
  avatar?: string | undefined;
  race?: string | undefined;
  class?: string | undefined;
  level?: number | undefined;
  hasTurnUndead?: boolean | undefined;
  // What the combat tracker needs from a player
  hp?: Character['hp'] | undefined;
  equipment?: Character['equipment'] | undefined;
  abilities?: Character['abilities'] | undefined;
}

/** A missing character shows by its id; a failed lookup throws. */
async function getCharacterSummary(userId: string, characterId: string): Promise<ResolvedData> {
  const characterData = await getCharacterById(userId, characterId);
  if (!characterData) return { characterName: characterId };
  return {
    characterName: characterData.name || characterId,
    avatar: characterData.avatar,
    race: characterData.race,
    class: characterData.class,
    level: characterData.level,
    hasTurnUndead: hasTurnUndeadAbility(characterData),
    hp: characterData.hp,
    equipment: characterData.equipment,
    abilities: characterData.abilities,
  };
}

/**
 * Character summaries for a list of players, looked up once each and kept for the life of the page.
 * shortcut: a summary isn't refreshed if the character changes meanwhile, and a failed lookup is reported but not retried until the page reloads; upgrade by watching each character.
 */
export function useDataResolver(requests: DataRequest[] = []) {
  const [found, setFound] = useState<Record<string, ResolvedData>>({});
  const [failed, setFailed] = useState(false);
  const wanted = useMemo(() => requests.filter((r) => r.userId && r.characterId).map((r) => `${r.userId}:${r.characterId}`), [requests]);
  const asked = useRef(new Set<string>());

  useEffect(() => {
    wanted
      .filter((key) => !asked.current.has(key))
      .forEach((key) => {
        asked.current.add(key);
        const [userId, characterId] = key.split(':') as [string, string];
        getCharacterSummary(userId, characterId).then(
          (summary) => setFound((f) => ({ ...f, [key]: summary })),
          (error) => {
            console.warn(`Failed to fetch character data for ${userId}/${characterId}:`, error);
            setFailed(true);
            setFound((f) => ({ ...f, [key]: { characterName: characterId } }));
          },
        );
      });
  }, [wanted]);

  const getResolvedData = (userId: string, characterId: string): ResolvedData | undefined => found[`${userId}:${characterId}`];
  const isLoading = wanted.some((key) => !(key in found));

  return { getResolvedData, isLoading, hasError: failed };
}

export type { DataRequest, ResolvedData };
