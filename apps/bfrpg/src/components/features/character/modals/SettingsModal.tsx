import { Modal } from '@/components/modals';
import { Switch } from '@/components/ui/core/primitives';
import { Typography } from '@/components/ui/core/display';
import type { Character } from '@/types';
import './SettingsModal.css';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  character: Character;
  onCharacterChange: (character: Character) => void;
}

export default function SettingsModal({ isOpen, onClose, character, onCharacterChange }: SettingsModalProps) {
  const handleUseCoinWeightChange = (useCoinWeight: boolean) => {
    const updatedCharacter: Character = {
      ...character,
      settings: {
        ...character.settings,
        useCoinWeight,
      },
    };
    onCharacterChange(updatedCharacter);
  };

  const handleShowCantripsChange = (showCantrips: boolean) => {
    const updatedCharacter: Character = {
      ...character,
      settings: {
        ...character.settings,
        showCantrips,
      },
    };
    onCharacterChange(updatedCharacter);
  };

  // Default to true if not set
  const useCoinWeight = character.settings?.useCoinWeight !== false;
  const showCantrips = character.settings?.showCantrips !== false;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Character Settings" size="md">
      <div className="modal-stack">
        <div className="settings-list">
          {/* Coin Weight Setting */}
          <div className="setting">
            <div>
              <Typography variant="bodySmall" color="zinc" weight="medium" as="h3">
                Include Coin Weight
              </Typography>
              <Typography variant="caption" color="muted">
                Whether coins contribute to your character's carrying capacity. When enabled, 20 coins = 1 pound.
              </Typography>
            </div>
            <div>
              <Switch label="Toggle coin weight" checked={useCoinWeight} onCheckedChange={handleUseCoinWeightChange} size="md" />
            </div>
          </div>

          {/* Show Cantrips/Orisons Setting */}
          <div className="setting">
            <div>
              <Typography variant="bodySmall" color="zinc" weight="medium" as="h3">
                Show Cantrips/Orisons
              </Typography>
              <Typography variant="caption" color="muted">
                Whether to display the cantrips/orisons section in the spells view. When disabled, the section is hidden.
              </Typography>
            </div>
            <div>
              <Switch label="Toggle cantrips visibility" checked={showCantrips} onCheckedChange={handleShowCantripsChange} size="md" />
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}
