import { Card, Typography } from '@/components/ui/core/display';
import { Button } from '@/components/ui/core/primitives';
import { SectionHeader } from '@/components/ui';
import { useDiceRoll } from '@/hooks/dice/useDiceRoll';
import { cn } from '@dice-jar/cn';
import './TurnUndeadSection.css';

interface TurnUndeadSectionProps {
  className?: string;
}

export default function TurnUndeadSection({ className }: TurnUndeadSectionProps) {
  const { rollAbility } = useDiceRoll();

  const handleTurnUndeadRoll = () => {
    rollAbility('Turn Undead', 0);
  };

  return (
    <section aria-labelledby="turn-undead-heading" className={cn('turn-undead', className)}>
      <SectionHeader
        title={
          <span className="icon-heading" id="turn-undead-heading">
            Turn Undead
          </span>
        }
        dotColor="purple"
        extra={
          <Button size="sm" variant="secondary" onClick={handleTurnUndeadRoll} icon="dice">
            Roll d20
          </Button>
        }
      />

      <Typography variant="caption" className="turn-undead-note">
        Faith-based ability • Can retry if successful, but cannot retry for one full turn if failed
      </Typography>

      <Card variant="standard" size="compact">
        <Typography variant="body">
          Clerics can Turn the undead, that is, drive away undead monsters by means of faith alone. The Cleric brandishes their holy symbol
          and calls upon the power of their divine patron. The player rolls 1d20 and tells the GM the result.
        </Typography>
      </Card>
    </section>
  );
}
