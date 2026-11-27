import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { rememberId, useRun } from '@dice-jar/browser';
import { createGame, deleteCharacter, useCharacters, useGameExists, useRolls, type CharacterCard } from '@/lib/games';
import { isOpenableId, MIN_GAME_ID } from '@dice-jar/game-id';
import { RECENT_GAMES } from '@/lib/gameId';
import { characterUrl, gameUrl, MAX_ID } from '@/lib/paths';
import { Alert, CopyButton, Hint, Loading, SubList, TableTitle } from '@/ui/bits';
import { Notice, Page } from './Page';

// Lazy: ui/index brings in react-aria, which this page otherwise doesn't load. Delete loads it through run() first, so a failed load shows an inline error instead of crashing the page.
const ConfirmDialog = lazy(() => import('@/ui').then((m) => ({ default: m.ConfirmDialog })));

// UTC and 24-hour, so the whole table agrees across time zones and the time fits on one line.
const when = (t: number) =>
  new Date(t).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hourCycle: 'h23', timeZone: 'UTC' });

const FAILED = 'Something went wrong. Check your connection and try again.';

export default function Game() {
  const { gameId = '' } = useParams();
  const nav = useNavigate();
  const exists = useGameExists(gameId);
  const characters = useCharacters(gameId);
  const rolls = useRolls(gameId);
  const [slow, setSlow] = useState(false); // a never-opened game can't be read offline, and the page can only wait
  useEffect(() => {
    setSlow(false);
    const t = setTimeout(() => setSlow(true), 10_000);
    return () => clearTimeout(t);
  }, [gameId]);
  const { busy, err, run } = useRun(FAILED);
  const [doomed, setDoomed] = useState<CharacterCard | null>(null);
  const [deleteFailed, setDeleteFailed] = useState(false);
  // Once a deleted character's row is gone, focus moves to New character instead of falling back to the page body.
  const removed = useRef<string | null>(null);
  const newCharacter = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (removed.current && characters.data && !characters.data.some((c) => c.id === removed.current)) {
      removed.current = null;
      newCharacter.current?.focus();
    }
  }, [characters.data]);
  const has = (id: string) => !characters.data || characters.data.some((c) => c.id === id);
  const link = location.origin + gameUrl(gameId); // no query or hash the visitor arrived with
  useEffect(() => {
    if (exists.data) rememberId(RECENT_GAMES, gameId);
  }, [exists.data, gameId]);

  // Not awaited: the write only settles once the server acknowledges it, which never happens offline. The list updates from the local cache.
  const remove = (c: CharacterCard) => {
    removed.current = c.id;
    setDeleteFailed(false);
    deleteCharacter(gameId, c.id).catch(() => setDeleteFailed(true));
  };
  // The sheet model is loaded on demand so this page stays small.
  const add = () =>
    run(async () => {
      const { createCharacter } = await import('@/lib/characters');
      nav(characterUrl(gameId, createCharacter(gameId)));
    });

  if (exists.error)
    return (
      <Notice page={gameId} title="Cannot reach game">
        <p className="warn">Could not load game {gameId}. Check your connection and reload.</p>
      </Notice>
    );
  if (exists.data === undefined)
    return (
      <Page title={gameId}>
        <Loading what="game" />
        <Alert>{slow && 'Still trying to reach the game. Check your connection.'}</Alert>
      </Page>
    );
  if (!exists.data) {
    const valid = isOpenableId(gameId, MAX_ID);
    return (
      <Notice page={gameId} title="No such game">
        <p>
          No game has the ID <b>{gameId}</b>.
        </p>
        <div className="row">
          <button className="btn primary" onClick={() => run(() => createGame(gameId))} disabled={busy || !valid}>
            Create game {gameId}
          </button>
          <Link className="btn" to="/">
            Back
          </Link>
        </div>
        {!valid && <Hint>IDs use lowercase letters, numbers and dashes, at least {MIN_GAME_ID} characters.</Hint>}
        <Alert>{err}</Alert>
      </Notice>
    );
  }

  return (
    <Page title={gameId}>
      <h1>Game {gameId}</h1>
      <p className="dim">Anyone with this link can see the game's characters and rolls. Share it with your table.</p>
      <div className="row">
        <code className="link">{link}</code>
        <CopyButton text={() => link} label="Copy game link" />
      </div>

      <section aria-labelledby="characters">
        <TableTitle>
          <span id="characters">CHARACTERS</span>
        </TableTitle>
        <SubList sub={characters} error="Could not load characters. Reload to retry." empty="No characters yet.">
          {(list) => (
            <ul className="characters">
              {list.map((c) => (
                <li key={c.id}>
                  <div>
                    <Link to={characterUrl(gameId, c.id)}>{c.name || 'Unnamed'}</Link>
                    <span className="dim">{c.hpMax ? ` · level ${c.level} · ${c.careers}` : ' · not finished'}</span>
                    {c.hpMax > 0 && (
                      <span className={c.hp === 0 ? 'warn' : undefined}>
                        {' '}
                        · HP {c.hp}/{c.hpMax}
                      </span>
                    )}
                  </div>
                  <button
                    className="btn"
                    onClick={() =>
                      run(async () => {
                        await import('@/ui');
                        setDoomed(c);
                      })
                    }
                    disabled={busy}
                    aria-label={`Delete ${c.name || 'unnamed character'}`}
                  >
                    Delete
                  </button>
                </li>
              ))}
            </ul>
          )}
        </SubList>
        <button ref={newCharacter} className="btn primary" onClick={add} disabled={busy}>
          New character
        </button>
        <Alert>{err}</Alert>
        <Alert>{deleteFailed && 'Could not delete the character. Check your connection and try again.'}</Alert>
        {doomed && (
          <Suspense>
            <ConfirmDialog title="Delete this character?" confirm="Delete" onClose={() => setDoomed(null)} onConfirm={() => remove(doomed)}>
              Delete {doomed.name || 'this character'} for everyone in this game? This cannot be undone. Their past rolls stay in the log.
            </ConfirmDialog>
          </Suspense>
        )}
      </section>

      <section aria-labelledby="log">
        <TableTitle>
          <span id="log">ROLL LOG</span>
        </TableTitle>
        <SubList
          sub={rolls}
          error="Could not load the roll log. Reload to retry."
          empty="No rolls yet. Rolls made on a sheet appear here for everyone."
        >
          {(list) => (
            <div>
              <table>
                <thead>
                  <tr>
                    <th>When (UTC)</th>
                    <th>Character</th>
                    <th>Roll</th>
                    <th className="num">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {list.map((r) => (
                    <tr key={r.id}>
                      <td className="dim">{when(r.createdAt)}</td>
                      <td>
                        {has(r.characterId) ? (
                          <Link to={characterUrl(gameId, r.characterId)}>{r.characterName || 'Unnamed'}</Link>
                        ) : (
                          <span>
                            {r.characterName}
                            <span className="sr-only"> (deleted)</span>
                          </span>
                        )}
                      </td>
                      <td>
                        {r.label}
                        <br />
                        <small className="dim">{r.detail}</small>
                      </td>
                      <td className="num">
                        <b>{r.total}</b>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </SubList>
      </section>
    </Page>
  );
}
