import { Button } from '@/components/ui/core/primitives';
import { LoadingState } from '@/components/ui/core/feedback';
import type { EncounterType } from '@/types';
import '../GameButtons.css';
import './Encounters.css';

interface EncounterGeneratorButtonProps {
  encounterType: EncounterType;
  isGenerating: boolean;
  hasTable: boolean;
  onGenerate: () => void;
}

export default function EncounterGeneratorButton({ encounterType, isGenerating, hasTable, onGenerate }: EncounterGeneratorButtonProps) {
  return (
    <div className="encounter-generate">
      {/* Generate Button */}
      <div>
        <Button
          variant="primary"
          size="lg"
          onClick={onGenerate}
          disabled={isGenerating || !hasTable}
          className="generate-button"
          icon="dice"
          iconSize="md"
          data-busy={isGenerating || undefined}
          aria-label={`Generate random ${encounterType} encounter${hasTable ? '' : ' (no encounters available)'}`}
          title={`Generate random ${encounterType} encounter`}
          role="button"
        />
      </div>

      {/* Loading State */}
      {isGenerating && (
        <div role="status" aria-live="polite">
          <LoadingState variant="inline" message="Rolling for encounter..." />
        </div>
      )}
    </div>
  );
}
