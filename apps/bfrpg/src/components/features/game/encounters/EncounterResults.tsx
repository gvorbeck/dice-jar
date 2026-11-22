import { Button } from '@/components/ui/core/primitives';
import { Typography, Card } from '@/components/ui/core/display';
import { Icon } from '@/components/ui/core/display';
import { SectionWrapper } from '@/components/ui/core/layout';
import './Encounters.css';

interface EncounterResultsProps {
  encounterOccurs: boolean | null;
  currentEncounter: string | null;
  onAddToCombat: (() => void) | undefined;
  isGenerating: boolean;
}

export default function EncounterResults({ encounterOccurs, currentEncounter, onAddToCombat, isGenerating }: EncounterResultsProps) {
  if (isGenerating || encounterOccurs === null) {
    return null;
  }

  return (
    <SectionWrapper title="Encounter Result">
      <Card
        variant="nested"
        size="compact"
        className="encounter-result"
        role="region"
        aria-live="polite"
        aria-label="Encounter generation result"
      >
        {encounterOccurs ? (
          <>
            <div className="encounter-verdict" data-hit>
              <Icon name="exclamation-triangle" size="md" aria-hidden={true} />
              <Typography variant="h6" color="primary" weight="bold">
                Encounter Occurs!
              </Typography>
            </div>
            {currentEncounter && (
              <div className="encounter-found">
                <Typography variant="h5" color="primary" weight="bold" role="heading" aria-level={3}>
                  {currentEncounter}
                </Typography>
                <Typography variant="bodySmall" color="muted">
                  * indicates a creature with special abilities or immunities
                </Typography>
                {onAddToCombat && (
                  <Button onClick={onAddToCombat} variant="primary" size="md" aria-label={`Add ${currentEncounter} to combat tracker`}>
                    Add to Combat Tracker
                  </Button>
                )}
              </div>
            )}
          </>
        ) : (
          <div className="encounter-verdict">
            <Icon name="check-circle" size="md" aria-hidden={true} />
            <Typography variant="h6" color="secondary">
              No Encounter
            </Typography>
          </div>
        )}
      </Card>
    </SectionWrapper>
  );
}
