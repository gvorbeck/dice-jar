import { useMemo, useCallback } from 'react';
import type { CharacterListItem } from '@/services';
import { useCopy } from '@dice-jar/browser';
import { useToast } from '@dice-jar/browser';
import { getRaceById, getClassById, isCustomClass, isCustomRace } from '@/utils';

export function useCharacterCard(character: CharacterListItem) {
  const { addToast } = useToast();
  const [, copy] = useCopy();

  // Memoized race name lookup for performance
  const raceName = useMemo(() => {
    if (!character.race) return null;

    // Handle custom races using new helper function
    if (isCustomRace(character.race)) {
      return character.race;
    }

    const race = getRaceById(character.race);
    return race?.name || character.race;
  }, [character.race]);

  // Memoized class name lookup for performance
  const classNames = useMemo(() => {
    if (!character.class) return [];

    const classId = character.class;

    // Handle custom classes
    if (isCustomClass(classId)) {
      return [
        {
          id: classId,
          name: classId || 'Custom Class',
        },
      ];
    }

    const classData = getClassById(classId);
    return [{ id: classId, name: classData?.name || classId }];
  }, [character.class]);

  const handleCopyUrl = useCallback(
    async (url: string, characterName: string) => {
      if (await copy(url)) addToast(`Character sheet URL copied for ${characterName}`, 'success');
      else addToast('Failed to copy URL to clipboard', 'error');
    },
    [copy, addToast],
  );

  return {
    raceName,
    classNames,
    handleCopyUrl,
  };
}
