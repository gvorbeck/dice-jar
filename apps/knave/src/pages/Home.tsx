import { useId, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { recentIds, useRun } from '@dice-jar/browser';
import { slugifyGameId } from '@dice-jar/game-id';
import { isOpenableId, makeGameId, MIN_ID, RECENT_GAMES } from '@/lib/gameId';
import { gameUrl, MAX_ID } from '@/lib/paths';
import { Alert, Hint, TableTitle } from '@/ui/bits';
import { Page } from './Page';

export default function Home() {
  const nav = useNavigate();
  const [raw, setRaw] = useState('');
  const { busy, err, run } = useRun('Could not create a game. Check your connection and try again.');
  const inputId = useId();
  const slug = slugifyGameId(raw, MAX_ID);
  const recent = recentIds(RECENT_GAMES);

  const open = (e: FormEvent) => {
    e.preventDefault();
    if (isOpenableId(slug)) nav(gameUrl(slug));
  };
  // Firestore loads on click, not with the landing page.
  const generate = () =>
    run(async () => {
      const id = makeGameId();
      await (await import('@/lib/games')).createGame(id);
      nav(gameUrl(id));
    });

  return (
    <Page>
      <h1 className="logo">Knave</h1>
      <p className="lede">Make your character, keep the party together, and roll where the whole table can see.</p>

      <section aria-labelledby="start">
        <TableTitle>
          <span id="start">START A NEW GAME</span>
        </TableTitle>
        <p>
          Get a fresh game ID to share with your table. Anyone with the ID can see the game's characters and rolls, so it works like an
          unlisted link.
        </p>
        <button className="btn primary" onClick={generate} disabled={busy}>
          {busy ? 'Creating…' : 'Generate game'}
        </button>
        <Alert>{err}</Alert>
      </section>

      <section aria-labelledby="open">
        <TableTitle>
          <span id="open">OPEN A GAME</span>
        </TableTitle>
        <form className="row" onSubmit={open}>
          <label htmlFor={inputId}>Game ID</label>
          <input
            id={inputId}
            value={raw}
            onChange={(e) => setRaw(e.target.value)}
            autoCapitalize="none"
            autoComplete="off"
            spellCheck={false}
          />
          <button className="btn primary" disabled={!isOpenableId(slug)}>
            Open
          </button>
        </form>
        <Hint>
          {slug && slug !== raw ? `Opens ${slug}. ` : ''}Letters, numbers and dashes, at least {MIN_ID}. An ID nobody has used yet offers to
          create that game.
        </Hint>
        {recent.length > 0 && (
          <>
            <h3>Recent</h3>
            <ul>
              {recent.map((id) => (
                <li key={id}>
                  <Link to={gameUrl(id)}>{id}</Link>
                </li>
              ))}
            </ul>
          </>
        )}
      </section>
    </Page>
  );
}
