/** localStorage key of the Agent saved by the old local-only editor. Shared so the game page can test for it without loading the sheet model. */
export const SAVED_AGENT_KEY = 'dg.character';
/** Where an unreadable or already-added saved Agent is kept, in case it's still needed. */
export const SAVED_AGENT_BAK = `${SAVED_AGENT_KEY}.bak`;
