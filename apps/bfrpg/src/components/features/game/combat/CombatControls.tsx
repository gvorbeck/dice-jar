import { Button } from '@/components/ui/core/primitives';
import { Typography, Card } from '@/components/ui/core/display';
import './Combat.css';

interface CombatControlsProps {
  isCombatActive: boolean;
  currentCombatantsCount: number;
  currentCombatant?:
    | {
        name: string;
      }
    | undefined;
  round: number;
  allCombatantsHaveInitiative?: boolean;
  onStartCombat: () => void | Promise<void>;
  onNextTurn: () => void;
  onEndCombat: () => void;
}

export default function CombatControls({
  isCombatActive,
  currentCombatantsCount,
  currentCombatant,
  round,
  allCombatantsHaveInitiative = true,
  onStartCombat,
  onNextTurn,
  onEndCombat,
}: CombatControlsProps) {
  return (
    <>
      <Card size="compact" variant="nested" className="combat-bar">
        <div className="combat-bar-controls">
          {!isCombatActive ? (
            <Button onClick={onStartCombat} disabled={currentCombatantsCount === 0 || !allCombatantsHaveInitiative} variant="primary">
              Start Combat
            </Button>
          ) : (
            <>
              <Button onClick={onNextTurn} variant="primary" disabled={!allCombatantsHaveInitiative}>
                Next Turn
              </Button>
              <Button onClick={onEndCombat} variant="secondary">
                End Combat
              </Button>
            </>
          )}
        </div>

        {isCombatActive && (
          <div className="combat-bar-status" role="status" aria-live="polite">
            <Typography variant="body" color="zinc">
              Round {round}
            </Typography>
            <Typography variant="bodySmall" color="secondary">
              {currentCombatant?.name}'s turn
            </Typography>
          </div>
        )}
      </Card>

      {isCombatActive && (
        <Typography variant="bodySmall" color="muted" className="combat-hint">
          Shortcuts: Space (Next) • E (End)
        </Typography>
      )}
    </>
  );
}
