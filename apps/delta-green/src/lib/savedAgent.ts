// Browser-only: the Functions bundle imports model/character.ts, so nothing here may live there.
import { downloadJson, store } from '@dice-jar/browser';
import { newCharacter, parseCharacter, type Character } from '@/model/character';
import { SAVED_AGENT_BAK, SAVED_AGENT_KEY } from './storage';

export const loadCharacter = (): Character => {
  const s = store.get(SAVED_AGENT_KEY);
  if (s) {
    try {
      return parseCharacter(JSON.parse(s));
    } catch {
      store.set(SAVED_AGENT_BAK, s);
    } // unreadable: keep the raw copy
  }
  return newCharacter();
};

export const exportJson = (c: Character) =>
  downloadJson(`${c.details.name.trim().replace(/\W+/g, '-').toLowerCase() || 'agent'}.dg.json`, c);
