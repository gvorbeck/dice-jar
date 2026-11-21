import { useState } from 'react';
import { Modal } from '@/components/modals';
import { Button, TextInput, FormField } from '@/components/ui/core/primitives';
import { Icon } from '@/components/ui/core/display';
import { TextHeader } from '@/components/ui/composite/TextHeader';
import { rollNotation } from '@dice-jar/dice';
import { useNotificationContext } from '@/hooks';
import './DiceRollerModal.css';

interface DiceRollerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function DiceRollerModal({ isOpen, onClose }: DiceRollerModalProps) {
  const [diceNotation, setDiceNotation] = useState('');
  const { showSuccess, showError } = useNotificationContext();

  const handleRoll = async () => {
    if (!diceNotation.trim()) {
      showError('Please enter dice notation (e.g., 3d6, 1d20+5)');
      return;
    }

    const formula = diceNotation.trim();
    const parsed = rollNotation(formula);
    if (!parsed.ok) {
      showError(parsed.error, { title: 'Roll Failed' });
      return;
    }
    const result = parsed.outcome;

    // Create a detailed result message
    const resultMessage = (
      <div className="dice-result">
        <TextHeader variant="h5" size="md" underlined={false}>
          <Icon name="dice" size="sm" />
          Roll Result: {result.total}
        </TextHeader>
        <div className="dice-result-lines">
          <div>
            <strong>Formula:</strong> {formula}
          </div>
          <div>
            <strong>Breakdown:</strong> {result.breakdown}
          </div>
        </div>
      </div>
    );

    showSuccess(resultMessage, {
      title: `Rolled ${formula}`,
      dismissible: true,
    });

    // Clear the input after successful roll
    setDiceNotation('');
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleRoll();
    }
  };

  const handleClose = () => {
    setDiceNotation('');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Dice Roller" size="md">
      <div className="modal-stack">
        <FormField label="Dice Notation" hint="Examples: 1d20, 3d6+2, 4d6dl1 (drop lowest), 2d20kh1 (keep highest)">
          <TextInput
            value={diceNotation}
            onChange={setDiceNotation}
            onKeyDown={handleKeyPress}
            placeholder="e.g., 3d6, 1d20+5, 4d6dl1"
            aria-label="Enter dice notation"
          />
        </FormField>

        <div className="dice-roll-actions modal-actions">
          <Button variant="secondary" onClick={handleClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleRoll} disabled={!diceNotation.trim()} icon="dice">
            Roll
          </Button>
        </div>
      </div>
    </Modal>
  );
}
