import { useCallback, useState } from 'react';
import { Modal } from '@/components/modals';
import { CheckboxGroup, FieldError, Label } from 'react-aria-components';
import { Button, Checkbox, Select, TextInput, TextArea, FormField } from '@/components/ui/core/primitives';
import { Typography } from '@/components/ui/core/display';
import type { Spell } from '@/types';
import './CustomSpellModal.css';

interface CustomSpellModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSpellAdd: (spell: Spell) => void;
}

const SPELL_LEVELS = [
  { value: '1', label: '1st Level' },
  { value: '2', label: '2nd Level' },
  { value: '3', label: '3rd Level' },
  { value: '4', label: '4th Level' },
  { value: '5', label: '5th Level' },
  { value: '6', label: '6th Level' },
  { value: '7', label: '7th Level' },
  { value: '8', label: '8th Level' },
  { value: '9', label: '9th Level' },
];

const SPELL_CLASSES = [
  { value: 'magic-user', label: 'Magic-User' },
  { value: 'cleric', label: 'Cleric' },
  { value: 'druid', label: 'Druid' },
  { value: 'illusionist', label: 'Illusionist' },
  { value: 'necromancer', label: 'Necromancer' },
  { value: 'spellcrafter', label: 'Spellcrafter' },
  { value: 'paladin', label: 'Paladin' },
];

type SpellClass = 'magic-user' | 'cleric' | 'druid' | 'illusionist' | 'necromancer' | 'spellcrafter' | 'paladin';

interface CustomSpellFormData {
  name: string;
  range: string;
  duration: string;
  description: string;
  availableForClasses: SpellClass[];
  spellLevel: number;
}

export default function CustomSpellModal({ isOpen, onClose, onSpellAdd }: CustomSpellModalProps) {
  const [formData, setFormData] = useState<CustomSpellFormData>({
    name: '',
    range: '',
    duration: '',
    description: '',
    availableForClasses: [],
    spellLevel: 1,
  });
  const [attemptedSubmit, setAttemptedSubmit] = useState(false);

  const handleReset = useCallback(() => {
    setFormData({
      name: '',
      range: '',
      duration: '',
      description: '',
      availableForClasses: [],
      spellLevel: 1,
    });
    setAttemptedSubmit(false);
  }, []);

  const handleSubmit = useCallback(() => {
    setAttemptedSubmit(true);

    if (!formData.name || !formData.range || !formData.duration || !formData.description || !formData.availableForClasses.length) return;

    // Build spell object with the level structure
    const newSpell: Spell = {
      name: formData.name,
      range: formData.range,
      duration: formData.duration,
      description: formData.description,
      level: {
        'magic-user': formData.availableForClasses.includes('magic-user') ? formData.spellLevel : null,
        cleric: formData.availableForClasses.includes('cleric') ? formData.spellLevel : null,
        druid: formData.availableForClasses.includes('druid') ? formData.spellLevel : null,
        illusionist: formData.availableForClasses.includes('illusionist') ? formData.spellLevel : null,
        necromancer: formData.availableForClasses.includes('necromancer') ? formData.spellLevel : null,
        spellcrafter: formData.availableForClasses.includes('spellcrafter') ? formData.spellLevel : null,
        paladin: formData.availableForClasses.includes('paladin') ? formData.spellLevel : null,
      },
    };

    onSpellAdd(newSpell);
    handleReset();
    onClose();
  }, [formData, onSpellAdd, handleReset, onClose]);

  const handleCancel = useCallback(() => {
    handleReset();
    onClose();
  }, [handleReset, onClose]);

  const isValid = Boolean(
    formData.name && formData.range && formData.duration && formData.description && formData.availableForClasses.length > 0,
  );

  return (
    <Modal isOpen={isOpen} onClose={handleCancel} title="Create Custom Spell" size="lg">
      <div className="custom-form">
        {/* Basic Information */}
        <div className="custom-block">
          <Typography variant="body" weight="medium">
            Basic Information
          </Typography>

          {/* Name */}
          <FormField label="Spell Name" required {...(attemptedSubmit && !formData.name && { error: 'Spell name is required' })}>
            <TextInput
              value={formData.name}
              onChange={(value) => setFormData((prev) => ({ ...prev, name: value }))}
              placeholder="Enter spell name..."
              error={attemptedSubmit && !formData.name}
            />
          </FormField>

          {/* Range */}
          <FormField label="Range" required {...(attemptedSubmit && !formData.range && { error: 'Range is required' })}>
            <TextInput
              value={formData.range}
              onChange={(value) => setFormData((prev) => ({ ...prev, range: value }))}
              placeholder="e.g., Touch, 30', 100'+10'/level, etc."
              error={attemptedSubmit && !formData.range}
            />
          </FormField>

          {/* Duration */}
          <FormField label="Duration" required {...(attemptedSubmit && !formData.duration && { error: 'Duration is required' })}>
            <TextInput
              value={formData.duration}
              onChange={(value) => setFormData((prev) => ({ ...prev, duration: value }))}
              placeholder="e.g., Instant, 1 turn, 1 round/level, etc."
              error={attemptedSubmit && !formData.duration}
            />
          </FormField>

          {/* Description */}
          <FormField label="Description" required {...(attemptedSubmit && !formData.description && { error: 'Description is required' })}>
            <TextArea
              value={formData.description}
              onChange={(value) => setFormData((prev) => ({ ...prev, description: value }))}
              placeholder="Describe the spell's effects and how it works..."
              rows={5}
              error={attemptedSubmit && !formData.description}
            />
          </FormField>
        </div>

        {/* Spell Properties */}
        <div className="custom-block form-section">
          <Typography variant="body" weight="medium">
            Spell Properties
          </Typography>

          {/* Spell Level */}
          <Select
            label="Spell Level"
            options={SPELL_LEVELS}
            value={formData.spellLevel.toString()}
            onValueChange={(value) => setFormData((prev) => ({ ...prev, spellLevel: parseInt(value) }))}
            required
          />

          {/* Available Classes */}
          <CheckboxGroup
            className="form-field"
            isRequired
            isInvalid={attemptedSubmit && formData.availableForClasses.length === 0}
            value={formData.availableForClasses}
            onChange={(classes) => setFormData((prev) => ({ ...prev, availableForClasses: classes as SpellClass[] }))}
          >
            <Label className="form-field-label">
              Available for Classes
              <span className="form-field-required" aria-hidden="true">
                *
              </span>
            </Label>
            <div className="spell-classes">
              {SPELL_CLASSES.map((spellClass) => (
                <Checkbox key={spellClass.value} value={spellClass.value} label={spellClass.label} />
              ))}
            </div>
            <FieldError className="form-field-error">Select at least one class</FieldError>
          </CheckboxGroup>
        </div>
      </div>

      {/* Modal Actions */}
      <div className="custom-actions">
        <Button onClick={handleCancel} variant="secondary" size="md">
          Cancel
        </Button>
        <Button onClick={handleSubmit} variant="primary" size="md" disabled={!isValid}>
          Create Spell
        </Button>
      </div>
    </Modal>
  );
}
