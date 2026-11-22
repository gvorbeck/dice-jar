import { useEffect } from 'react';
import { useSub, useToast, type Sub } from '@dice-jar/browser';
import { useAuth } from '@/hooks';
import { watchUserCharacters, watchCharacter, watchUserGames, watchGame } from '@/services';
import type { Character, Game } from '@/types';
import type { CharacterListItem } from '@/services/characters';

const nothing = () => () => {};
// A half-empty key (a route param still missing) must not reach doc()/collection(), which throw on an empty segment.
const parts = (key: string): [string, string] | null => {
  const [a, b] = key.split('/');
  return a && b ? [a, b] : null;
};

const subCharacters: Sub<CharacterListItem[]> = (userId, ok, bad) => (userId ? watchUserCharacters(userId, ok, bad) : nothing());
const subCharacter: Sub<Character | null> = (key, ok, bad) => {
  const p = parts(key);
  return p ? watchCharacter(...p, ok, bad) : nothing();
};
const subGames: Sub<Game[]> = (userId, ok, bad) => (userId ? watchUserGames(userId, ok, bad) : nothing());
const subGame: Sub<Game | null> = (key, ok, bad) => {
  const p = parts(key);
  return p ? watchGame(...p, ok, bad) : nothing();
};

/** Shows a load failure once, as a toast. */
function useReportError(error: Error | undefined, entityType: string) {
  const { addToast } = useToast();
  useEffect(() => {
    if (!error) return;
    const denied = (error as { code?: string }).code === 'permission-denied';
    addToast(denied ? "You don't have permission to see this." : `Failed to load ${entityType}. Please try again.`, 'error');
  }, [error, entityType, addToast]);
}

/** The signed-in user's characters, live. */
export function useEnhancedCharacters() {
  const { user } = useAuth();
  const { data, error } = useSub(user?.uid ?? '', subCharacters);
  useReportError(error, 'characters');
  return { data, error, isLoading: !!user && !data && !error };
}

/** One character, live, with whether the signed-in user owns it. */
export function useEnhancedCharacterSheet(userId: string, characterId: string) {
  const { user } = useAuth();
  const { data, error } = useSub(`${userId}/${characterId}`, subCharacter);
  useReportError(error, 'character');
  return {
    data: data === undefined ? undefined : { character: data, isOwner: Boolean(user && userId === user.uid) },
    error,
    isLoading: !!userId && !!characterId && data === undefined && !error,
  };
}

/** The signed-in user's games, live. */
export function useEnhancedGames() {
  const { user } = useAuth();
  const { data, error } = useSub(user?.uid ?? '', subGames);
  useReportError(error, 'games');
  return { data, error, isLoading: !!user && !data && !error };
}

/** One game, live, with whether the signed-in user owns it. */
export function useEnhancedGame(userId: string, gameId: string) {
  const { user } = useAuth();
  const { data, error } = useSub(`${userId}/${gameId}`, subGame);
  useReportError(error, 'game');
  return {
    data: data === undefined ? undefined : { game: data, isOwner: Boolean(user && userId === user.uid) },
    error,
    isLoading: !!userId && !!gameId && data === undefined && !error,
  };
}
