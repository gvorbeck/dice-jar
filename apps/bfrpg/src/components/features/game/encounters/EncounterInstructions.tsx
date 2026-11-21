import { Typography } from '@/components/ui/core/display';
import { Card } from '@/components/ui/core/display';
import { List, StepListItem } from '@/components/ui/composite';
import { SectionWrapper } from '@/components/ui/core/layout';
import './Encounters.css';

export default function EncounterInstructions() {
  return (
    <SectionWrapper title="Usage Instructions">
      <Card
        variant="nested"
        size="compact"
        className="encounter-notes"
        role="complementary"
        aria-label="How to use the encounter generator"
      >
        <List variant="steps" spacing="tight">
          <StepListItem>
            <Typography variant="bodySmall" color="muted" data-inline>
              Select the type of encounter (Dungeon, Wilderness, or City)
            </Typography>
          </StepListItem>
          <StepListItem>
            <Typography variant="bodySmall" color="muted" data-inline>
              Choose the specific subtype (level, terrain, or time)
            </Typography>
          </StepListItem>
          <StepListItem>
            <Typography variant="bodySmall" color="muted" data-inline>
              Click the dice button to roll for an encounter
            </Typography>
          </StepListItem>
          <StepListItem>
            <Typography variant="bodySmall" color="muted" data-inline>
              The system first checks if an encounter occurs (1 in 6 chance)
            </Typography>
          </StepListItem>
          <StepListItem>
            <Typography variant="bodySmall" color="muted" data-inline>
              If an encounter occurs, a creature is randomly selected from the appropriate table
            </Typography>
          </StepListItem>
        </List>
      </Card>
    </SectionWrapper>
  );
}
