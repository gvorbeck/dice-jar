import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useDebouncedSave, useLoad } from '@dice-jar/browser';
import { DamagedCharacter, loadCharacter, saveCharacter } from '@/lib/characters';
import { logRoll } from '@/lib/games';
import { gameUrl } from '@/lib/paths';
import { isCreated, type Character as Sheet_ } from '@/model/character';
import { Creator } from '@/Creator';
import { Sheet } from '@/Sheet';
import type { Up } from '@/ui';
import { Loading } from '@/ui/bits';
import { Notice, Page } from './Page';

export default function Character() {
  const { gameId = '', characterId = '' } = useParams();
  const key = `${gameId}/${characterId}`;
  const s = useLoad(key, () => loadCharacter(gameId, characterId));

  if (!s.error && s.data === undefined)
    return (
      <Page>
        <Loading what="character" />
      </Page>
    );
  if (s.error || !s.data)
    return (
      <Notice title={s.error ? 'Cannot open character' : 'No such character'}>
        <p className={s.error ? 'warn' : undefined}>
          {s.error instanceof DamagedCharacter
            ? "This character's saved data is damaged and can't be opened."
            : s.error
              ? 'This character could not be loaded. Check your connection and reload.'
              : 'This game has no character with that ID.'}
        </p>
        <Link className="btn" to={gameUrl(gameId)}>
          Back to game {gameId}
        </Link>
      </Notice>
    );
  return <Body key={key} gameId={gameId} id={characterId} init={s.data} />;
}

/** One character, loaded once. Local state is the source of truth while the page is open; changes are written back as they settle. */
function Body({ gameId, id, init }: { gameId: string; id: string; init: Sheet_ }) {
  const [c, setC] = useState(init);
  const [mode, setMode] = useState<'create' | 'sheet'>(isCreated(init) ? 'sheet' : 'create');
  // One flag per kind of write, so one succeeding never hides another still failing. A roll is never retried.
  const [fails, setFails] = useState({ save: false, roll: false });
  const report = (k: keyof typeof fails, ok: boolean) => setFails((f) => (f[k] === !ok ? f : { ...f, [k]: !ok }));
  const up: Up = (fn) =>
    setC((prev) => {
      const d = structuredClone(prev);
      fn(d);
      return d;
    });

  // Each change is written once it has been still for a moment, and at once when the page hides or closes. What was loaded isn't written back.
  // A save resolves once queued, because offline the server's answer can take any time and waiting for it would hold every later edit in memory.
  // shortcut: a write the server refuses is reported but not retried by the hook; the next edit resends it through the diff.
  const { onChange: save } = useDebouncedSave((v: Sheet_) => {
    saveCharacter(gameId, id, v).then(
      () => report('save', true),
      () => report('save', false),
    );
    return Promise.resolve();
  }, 600);
  useEffect(() => void (c !== init && save(c)), [c, init, save]);

  const failed = fails.save || fails.roll ? 'Not saved: check your connection and reload.' : '';
  return (
    <Page title={c.name.trim() || 'Unnamed'} wide={mode === 'sheet'}>
      {mode === 'create' ? (
        <Creator
          c={c}
          up={up}
          onDone={() => {
            up((d) => void (d.created = true));
            setMode('sheet');
          }}
        />
      ) : (
        <Sheet
          c={c}
          up={up}
          failed={failed}
          onRoll={(label, detail, total) =>
            logRoll(gameId, { characterId: id, characterName: c.name, label, detail, total }).then(
              () => report('roll', true),
              () => report('roll', false),
            )
          }
        />
      )}
      <p>
        <Link to={gameUrl(gameId)}>Back to game {gameId}</Link>
      </p>
    </Page>
  );
}
