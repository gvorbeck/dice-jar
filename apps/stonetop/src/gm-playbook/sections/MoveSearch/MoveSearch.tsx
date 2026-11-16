import { useState, useMemo, useId } from 'react';
import { Input, Text, PlaybookColumns } from '@/ui';
import { Move } from '@/character/Move/Move';
import { BASIC_MOVES, SPECIAL_MOVES, FOLLOWER_MOVES, HOMEFRONT_MOVES, EXPEDITION_MOVES } from '@/rules/moves';
import { ALL_PLAYBOOK_MOVES } from '@/rules/moves/allPlaybookMoves';
import { LIGHTBEARER_INVOCATIONS } from '@/rules/moves/lightbearerInvocations';
import { REVENANT_MOVES, GHOST_MOVES, THRALL_MOVES, THRALL_MARK_DEFINITIONS } from '@/rules/moves/inserts';
import type { MoveDefinition } from '@/model';

const ALL_MOVES = [
  ...BASIC_MOVES,
  ...SPECIAL_MOVES,
  ...FOLLOWER_MOVES,
  ...HOMEFRONT_MOVES,
  ...EXPEDITION_MOVES,
  ...Object.values(ALL_PLAYBOOK_MOVES).flat(),
  ...LIGHTBEARER_INVOCATIONS,
  ...REVENANT_MOVES,
  ...GHOST_MOVES,
  ...THRALL_MOVES,
  ...THRALL_MARK_DEFINITIONS,
].sort((a, b) => a.name.localeCompare(b.name));

const MoveList = ({ moves }: { moves: MoveDefinition[] }) => (
  <ul className="move-search-list">
    {moves.map((move) => (
      <li key={move.id} className="move-search-item">
        <Move title={move.name} move={move} />
      </li>
    ))}
  </ul>
);

export const MoveSearch = () => {
  const [query, setQuery] = useState('');
  const resultHintId = useId();

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return ALL_MOVES.filter((m) => m.name.toLowerCase().includes(q));
  }, [query]);

  const mid = Math.ceil(results.length / 2);
  const leftCol = results.slice(0, mid);
  const rightCol = results.slice(mid);

  return (
    <div className="col gap-3">
      <Input
        placeholder="Search moves by name…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        aria-label="Search moves by name"
        aria-describedby={query.trim() ? resultHintId : undefined}
        className="w-full"
      />
      <div id={resultHintId} aria-live="polite" aria-atomic="true">
        {query.trim() &&
          (results.length === 0 ? (
            <Text font="serif" color="muted" className="move-search-empty">
              No moves match "{query}".
            </Text>
          ) : (
            <Text as="span" className="move-search-visually-hidden field-sr-only">
              {results.length} move{results.length === 1 ? '' : 's'} found.
            </Text>
          ))}
      </div>
      {results.length > 0 && (
        <section aria-label="Move search results" className="mt-3">
          <PlaybookColumns left={<MoveList moves={leftCol} />} right={rightCol.length > 0 ? <MoveList moves={rightCol} /> : undefined} />
        </section>
      )}
    </div>
  );
};
