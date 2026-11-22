import { memo } from 'react';
import { HorizontalRule } from '@/components/ui/composite';
import { SectionWrapper } from '@/components/ui/core/layout';
import { TextArea } from '@/components/ui/core/primitives';
import { Typography } from '@/components/ui/core/display';
import { useDebouncedTextField } from '@dice-jar/browser';
import './GameNotesSection.css';

interface GameNotesSectionProps {
  notes: string;
  showDivider?: boolean;
  editable?: boolean;
  onNotesChange?: (notes: string) => void;
}

export const GameNotesSection = memo(({ notes, showDivider = false, editable = false, onNotesChange }: GameNotesSectionProps) => {
  // Saves after typing pauses, and at once on blur
  const debouncedNotes = useDebouncedTextField(notes || '', async (value) => onNotesChange?.(value), 500);

  // Show section if there are notes OR if it's editable (so user can add notes)
  if (!notes?.trim() && !editable) {
    return null;
  }

  return (
    <>
      {showDivider && <HorizontalRule />}
      <SectionWrapper title="Game Notes">
        <div className="game-notes-body">
          {editable ? (
            <div className="game-notes-edit">
              <TextArea
                value={debouncedNotes.value}
                onChange={debouncedNotes.onChange}
                onBlur={debouncedNotes.onBlur}
                placeholder="Add your game notes, session summaries, important plot points, and anything else you'd like to remember..."
                maxLength={5000}
                rows={12}
                showClearButton={true}
                aria-label="Game notes"
                className="note-input"
                resize="vertical"
              />
              <div className="note-foot">
                <span>{debouncedNotes.value.length} / 5000 characters</span>
                <span>{debouncedNotes.isPending ? 'Saving...' : 'Saves automatically after you stop typing (500ms)'}</span>
              </div>
            </div>
          ) : (
            <div className="game-notes-read">
              <Typography variant="body" color="secondary">
                {notes}
              </Typography>
            </div>
          )}
        </div>
      </SectionWrapper>
    </>
  );
});

GameNotesSection.displayName = 'GameNotesSection';
