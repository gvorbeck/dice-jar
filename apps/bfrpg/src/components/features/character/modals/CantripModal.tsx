import { useId, useEffect, useRef } from 'react';
import { Card, Typography, Badge } from '@/components/ui/core/display';
import { Button, Select } from '@/components/ui/core/primitives';
import { Modal } from '@/components/modals';
import { Icon } from '@/components/ui';
import type { Cantrip } from '@/types';
import type { SpellTypeInfo } from '@/types';
import './CantripModal.css';

interface CantripModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (cantripName: string) => void;
  availableCantrips: Cantrip[];
  selectedCantripName: string;
  onSelectionChange: (cantripName: string) => void;
  spellTypeInfo: SpellTypeInfo;
  mode: 'creation' | 'edit';
  cantripOptions: Array<{ value: string; label: string }>;
}

export default function CantripModal({
  isOpen,
  onClose,
  onAdd,
  availableCantrips,
  selectedCantripName,
  onSelectionChange,
  spellTypeInfo,
  mode,
  cantripOptions,
}: CantripModalProps) {
  const descriptionId = useId();
  const selectRef = useRef<HTMLSelectElement>(null);

  // Focus management for accessibility
  useEffect(() => {
    if (isOpen && selectRef.current) {
      // Small delay to ensure modal is fully rendered
      const timer = setTimeout(() => {
        selectRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [isOpen]);

  const selectedCantrip = availableCantrips.find((c) => c.name === selectedCantripName);

  const modalTitle = mode === 'creation' ? `Change ${spellTypeInfo.capitalized} Selection` : `Add ${spellTypeInfo.capitalized}`;

  const instructionText =
    mode === 'creation'
      ? `Replace one of your starting ${spellTypeInfo.type} with another option.`
      : `Choose ${spellTypeInfo.type} to add to your character. You can add multiple - the modal will stay open.`;

  const handleAdd = () => {
    if (selectedCantripName) {
      onAdd(selectedCantripName);
      // Don't close modal, just reset selection to allow adding more
      onSelectionChange('');
    }
  };

  const handleClose = () => {
    onSelectionChange('');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={modalTitle} size="md">
      <div className="cantrip-pick" role="dialog" aria-labelledby="cantrip-modal-title">
        <Typography variant="body" id={descriptionId}>
          {instructionText}
        </Typography>

        <Select
          label={`Available ${spellTypeInfo.capitalized}`}
          value={selectedCantripName}
          onValueChange={onSelectionChange}
          options={cantripOptions}
          placeholder={`Choose a ${spellTypeInfo.singular}`}
          aria-describedby={descriptionId}
          required
        />

        {selectedCantrip && (
          <Card variant="info" role="region" aria-labelledby="selected-cantrip-preview">
            <div className="cantrip-preview">
              <div className="cantrip-preview-head">
                <Icon name="lightning" size="lg" aria-hidden={true} />
                <Typography variant="infoHeading" id="selected-cantrip-preview">
                  {selectedCantrip.name}
                </Typography>
                <Badge variant="status" aria-label={`This is a ${spellTypeInfo.singular}`}>
                  {spellTypeInfo.capitalizedSingular}
                </Badge>
              </div>

              <Card variant="nested">
                <Typography variant="subHeadingSpaced">
                  <Icon name="info" size="sm" aria-hidden={true} />
                  Description
                </Typography>
                <Typography variant="description" aria-describedby="selected-cantrip-preview">
                  {selectedCantrip.description}
                </Typography>
              </Card>
            </div>
          </Card>
        )}

        <div className="modal-buttons" role="group" aria-label="Modal actions">
          <Button variant="ghost" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleAdd}
            disabled={!selectedCantripName}
            aria-describedby={selectedCantripName ? undefined : 'add-button-help'}
          >
            Add {spellTypeInfo.capitalizedSingular}
          </Button>
          {!selectedCantripName && (
            <div id="add-button-help" className="sr-only" aria-live="polite">
              Please select a {spellTypeInfo.singular} to continue
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
