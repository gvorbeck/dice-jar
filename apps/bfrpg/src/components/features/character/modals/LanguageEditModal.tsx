import { useCallback, useState, useEffect } from 'react';
import { Modal } from '@/components/modals';
import { LanguageSelector } from '@/components/features/character/creation';
import { Button } from '@/components/ui';
import { HorizontalRule } from '@/components/ui/composite';
import type { Character } from '@/types';
import './LanguageEditModal.css';

interface LanguageEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  character: Character;
  onCharacterChange: (character: Character) => void;
}

export default function LanguageEditModal({ isOpen, onClose, character, onCharacterChange }: LanguageEditModalProps) {
  // Local state for editing
  const [localCharacter, setLocalCharacter] = useState<Character>(character);

  // Reset local state when modal opens with new character data
  useEffect(() => {
    if (isOpen) {
      setLocalCharacter(character);
    }
  }, [isOpen, character]);

  const handleLocalCharacterChange = useCallback((updatedCharacter: Character) => {
    // Update local state only, don't save to Firebase yet
    setLocalCharacter(updatedCharacter);
  }, []);

  const handleSave = useCallback(() => {
    onCharacterChange(localCharacter);
    onClose();
  }, [localCharacter, onCharacterChange, onClose]);

  const handleCancel = useCallback(() => {
    // Close modal without saving
    onClose();
  }, [onClose]);

  return (
    <Modal isOpen={isOpen} onClose={handleCancel} title="Edit Languages" size="lg">
      <>
        <LanguageSelector character={localCharacter} onCharacterChange={handleLocalCharacterChange} />

        <HorizontalRule className="language-rule" />

        {/* Modal Action Buttons */}
        <div className="modal-buttons" data-roomy role="group" aria-label="Modal actions">
          <Button variant="ghost" onClick={handleCancel}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSave}>
            Save Changes
          </Button>
        </div>
      </>
    </Modal>
  );
}
