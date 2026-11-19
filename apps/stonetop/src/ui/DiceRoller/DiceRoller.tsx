import { useCallback, useEffect, useRef, useState } from 'react';
import { cn } from '@dice-jar/cn';
import { Button, Heading, Icon, Input, Text } from '@/ui';
import { rollNotation, withDie, withModifier, type DiceRollOutcome } from '@dice-jar/dice';
import { generateId } from '@/lib/id';
import { NOTATION_MAX_LENGTH } from '@/lib/constants';
import type { LoggedRoll } from '@/model';

interface DiceRollerProps {
  // Who is rolling, for the shared log: a character id/name, or 'gm' / 'steading' / 'game' on pages
  // without a character.
  rollerId: string;
  rollerName: string;
  onRoll: (roll: LoggedRoll) => Promise<void>;
}

const DICE = [4, 6, 8, 10, 12, 20, 100] as const;
const HISTORY_LIMIT = 6;

interface HistoryEntry extends DiceRollOutcome {
  id: string;
}

// A slide-out dice roller pinned to the bottom-right of every playbook page, its tab attached to the panel. Takes any dice notation (typed) or
// builds one from the die buttons; each completed roll shows here and is appended to the shared roll log
// on the game page.
export const DiceRoller = ({ rollerId, rollerName, onRoll }: DiceRollerProps) => {
  const [open, setOpen] = useState(false);
  const [notation, setNotation] = useState('');
  const [error, setError] = useState<string | undefined>();
  // This session's rolls, newest first, so a result can be glanced at or re-rolled. Local only — the
  // shared log on the game page is the permanent record.
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const tabRef = useRef<HTMLButtonElement>(null);

  // Move focus into the drawer when it opens (the panel turns visible immediately on open, so this
  // lands). Closing returns focus to the tab from the handlers below, not here, so the initial mount
  // doesn't steal focus.
  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  const handleToggle = useCallback(() => setOpen((o) => !o), []);

  const handleClose = useCallback(() => {
    setOpen(false);
    tabRef.current?.focus();
  }, []);

  // Escape closes the drawer from anywhere on the page while it is open.
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open, handleClose]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setNotation(e.target.value);
    setError(undefined);
  }, []);

  const roll = useCallback(
    (input: string) => {
      const result = rollNotation(input);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      const { outcome } = result;
      setError(undefined);
      setHistory((h) => [{ id: generateId(), ...outcome }, ...h].slice(0, HISTORY_LIMIT));
      // Fire-and-forget like move rolls: reportSave surfaces a failed write, and a dropped log entry is
      // acceptable. The result still shows here either way.
      onRoll({
        id: `${rollerId}-${generateId()}`,
        characterId: rollerId,
        characterName: rollerName,
        moveName: '',
        stat: 'nothing',
        dice: [],
        mod: 0,
        total: outcome.total,
        mode: 'normal',
        band: null,
        notation: outcome.notation,
        breakdown: outcome.breakdown,
        createdAt: Date.now(),
      }).catch(() => {});
    },
    [onRoll, rollerId, rollerName],
  );

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      roll(notation);
    },
    [roll, notation],
  );

  // Tapping a past roll loads its notation back into the field, ready to roll again.
  const handleReuse = useCallback((n: string) => {
    setNotation(n);
    setError(undefined);
    inputRef.current?.focus();
  }, []);

  const handleClear = useCallback(() => {
    setNotation('');
    setError(undefined);
    inputRef.current?.focus();
  }, []);

  const handleDie = useCallback((sides: number) => {
    setNotation((n) => withDie(n, sides));
    setError(undefined);
  }, []);

  const handleModifier = useCallback((delta: number) => {
    setNotation((n) => withModifier(n, delta));
    setError(undefined);
  }, []);

  const panelId = 'dice-roller-panel';
  const [last, ...earlier] = history;

  return (
    <div className={cn('dice-roller', open && 'dice-roller-open')}>
      <button
        ref={tabRef}
        type="button"
        className="dice-roller-tab field-focus-visible"
        onClick={handleToggle}
        aria-expanded={open}
        aria-controls={panelId}
      >
        <Icon name="dice" size="small" />
        Dice
      </button>

      <section id={panelId} className="dice-roller-panel" aria-label="Dice roller">
        {/* The tab already toggles the drawer; this gives keyboard and touch users a close control
            right where they're working. */}
        <div className="dice-roller-header">
          <Heading as="h2" size="label" className="row gap-2">
            <Icon name="dice" size="small" />
            Dice Roller
          </Heading>
          <Button type="button" variant="ghost" size="sm" icon="close" aria-label="Close dice roller" onClick={handleClose} />
        </div>
        <form className="col gap-3" onSubmit={handleSubmit}>
          <Input
            ref={inputRef}
            label="Dice notation"
            note="e.g. 2d6+1, 4d6kh3, d20"
            value={notation}
            onChange={handleChange}
            error={error}
            aria-invalid={error ? true : undefined}
            autoComplete="off"
            maxLength={NOTATION_MAX_LENGTH}
            autoCapitalize="off"
            spellCheck={false}
            inputMode="text"
            enterKeyHint="go"
          />

          <div className="dice-roller-dice" role="group" aria-label="Add a die">
            {DICE.map((sides) => (
              <Button key={sides} type="button" variant="secondary" size="sm" className="dice-roller-die" onClick={() => handleDie(sides)}>
                d{sides}
              </Button>
            ))}
          </div>

          <div className="dice-roller-mods" role="group" aria-label="Modifier">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              icon="minus"
              aria-label="Subtract 1 from the modifier"
              onClick={() => handleModifier(-1)}
            />
            <Text as="span" size="xs" color="muted">
              Modifier
            </Text>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              icon="plus"
              aria-label="Add 1 to the modifier"
              onClick={() => handleModifier(1)}
            />
          </div>

          <div className="dice-roller-actions">
            <Button type="submit" icon="dice" className="grow">
              Roll
            </Button>
            <Button type="button" variant="ghost" onClick={handleClear} disabled={!notation}>
              Clear
            </Button>
          </div>
        </form>

        {/* Polite live region so the result is announced to screen readers when a roll lands. */}
        <div className="dice-roller-result" aria-live="polite">
          {last ? (
            // Keyed on the roll so each new result replays the pop-in animation.
            <div key={last.id} className="dice-roller-result-card">
              <Text as="span" size="xs" color="muted" className="dice-roller-result-notation">
                {last.notation}
              </Text>
              <span className="dice-roller-total">{last.total}</span>
              <Text as="span" size="sm" color="muted" className="dice-roller-breakdown">
                {last.breakdown}
              </Text>
            </div>
          ) : (
            <Text size="sm" color="muted" className="dice-roller-empty">
              Your roll appears here.
            </Text>
          )}
        </div>

        {earlier.length > 0 && (
          <div className="col gap-2">
            <Heading as="h3" size="label">
              Earlier
            </Heading>
            <ul className="dice-roller-history-list">
              {earlier.map((h) => (
                <li key={h.id}>
                  <button
                    type="button"
                    className="dice-roller-history-item field-focus-visible"
                    onClick={() => handleReuse(h.notation)}
                    aria-label={`Reuse ${h.notation}, rolled ${h.total}`}
                  >
                    <span className="dice-roller-history-notation">{h.notation}</span>
                    <span className="dice-roller-history-total">{h.total}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>
    </div>
  );
};
