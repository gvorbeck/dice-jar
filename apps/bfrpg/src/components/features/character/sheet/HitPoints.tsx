import { NumberInput, TextArea } from '@/components/ui/core/primitives';
import { SectionWrapper } from '@/components/ui/core/layout';
import { StatusIndicator } from '@/components/ui/composite';
import { useDebouncedTextField } from '@dice-jar/browser';
import type { Character } from '@/types';
import './HitPoints.css';

interface HitPointsProps {
  character: Character;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  editable?: boolean;
  onCurrentHPChange?: (value: number) => void;
  onHPNotesChange?: (value: string) => void;
}

export default function HitPoints({
  character,
  className = '',
  size = 'md',
  editable = false,
  onCurrentHPChange,
  onHPNotesChange,
}: HitPointsProps) {
  // Saves after typing pauses, and at once on blur
  const debouncedHPNotes = useDebouncedTextField(character.hp.desc || '', async (value) => onHPNotesChange?.(value), 500);

  const handleCurrentHPChange = (value: number | undefined) => {
    if (value !== undefined && onCurrentHPChange) {
      onCurrentHPChange(value);
    }
  };

  return (
    <SectionWrapper title="Hit Points" size={size} className={className}>
      {/* HP Content */}
      <div className="sheet-pad" data-size={size}>
        <div className="hp">
          {/* Current HP Input and Max HP Indicator */}
          <div className="hp-top">
            <div>
              {editable && (
                <div className="hp-edit">
                  <div>
                    <NumberInput
                      value={character.hp.current}
                      onChange={handleCurrentHPChange}
                      minValue={-99}
                      maxValue={999}
                      size="sm"
                      className="hp-current"
                      aria-label="Current hit points"
                      placeholder="0"
                    />
                  </div>
                  <div className="hp-slash">/</div>
                  <div className="sheet-chip hp-max" title="Maximum hit points">
                    {character.hp.max}
                  </div>
                </div>
              )}

              {/* Status Bar only */}
              <StatusIndicator current={character.hp.current} max={character.hp.max} showBar={true} showLabel={false} />
            </div>
          </div>

          {/* HP Notes */}
          <div>
            {editable ? (
              <>
                <TextArea
                  value={debouncedHPNotes.value}
                  onChange={debouncedHPNotes.onChange}
                  onBlur={debouncedHPNotes.onBlur}
                  placeholder="HP notes (injuries, effects, etc.)"
                  maxLength={200}
                  size="sm"
                  rows={3}
                  showClearButton={true}
                  aria-label="Hit point notes"
                  className="hp-notes"
                />
                {debouncedHPNotes.isPending && <div className="hp-saving">Saving...</div>}
              </>
            ) : (
              character.hp.desc && <div className="sheet-chip hp-desc">{character.hp.desc}</div>
            )}
          </div>

          {/* HP Status Text - positioned at bottom like original */}
          <StatusIndicator current={character.hp.current} max={character.hp.max} showBar={false} showLabel={true} className="hp-status" />
        </div>
      </div>
    </SectionWrapper>
  );
}
