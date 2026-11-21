import { useFormValidation } from '@/hooks';
import { Button, NumberInput, TextArea, TextInput, FormField } from '@/components/ui/core/primitives';
import { Modal } from '@/components/modals';
import './../ScrollCreation.css';

interface ScrollCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateProject: (projectData: { spellName: string; spellLevel: number; notes: string }) => void;
  calculateScrollCost: (spellLevel: number) => number;
  calculateScrollTime: (spellLevel: number) => number;
  calculateSuccessRate: (spellLevel: number) => number;
}

export const ScrollCreationModal = ({
  isOpen,
  onClose,
  onCreateProject,
  calculateScrollCost,
  calculateScrollTime,
  calculateSuccessRate,
}: ScrollCreationModalProps) => {
  const initialProjectData = {
    spellName: '',
    spellLevel: 1,
    notes: '',
  };

  const {
    formData: newProject,
    handleFieldChange: handleProjectFieldChange,
    resetForm: resetProjectForm,
    isValid: isProjectValid,
  } = useFormValidation(initialProjectData, (data) => Boolean(data.spellName.trim()));

  const handleCreateProject = () => {
    if (!newProject.spellName.trim()) return;

    onCreateProject(newProject);
    resetProjectForm();
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create New Scroll" size="md">
      <div className="form-stack">
        <FormField label="Spell Name">
          <TextInput
            value={newProject.spellName}
            onChange={(value) => handleProjectFieldChange('spellName', value)}
            placeholder="Enter spell name..."
          />
        </FormField>

        <FormField label="Spell Level">
          <NumberInput
            value={newProject.spellLevel}
            onChange={(value) => handleProjectFieldChange('spellLevel', value || 1)}
            minValue={1}
            maxValue={9}
          />
        </FormField>

        <div className="scroll-estimate">
          <div>
            <strong>Estimated Cost:</strong>
            <br />
            {calculateScrollCost(newProject.spellLevel)} gp
          </div>
          <div>
            <strong>Estimated Time:</strong>
            <br />
            {calculateScrollTime(newProject.spellLevel)} {calculateScrollTime(newProject.spellLevel) === 1 ? 'day' : 'days'}
          </div>
          <div>
            <strong>Success Rate:</strong>
            <br />
            {calculateSuccessRate(newProject.spellLevel)}%
          </div>
        </div>

        <FormField label="Notes (Optional)">
          <TextArea
            value={newProject.notes}
            onChange={(value) => handleProjectFieldChange('notes', value)}
            placeholder="Add any notes about this project..."
            rows={3}
          />
        </FormField>

        <div className="scroll-form-actions">
          <Button onClick={handleCreateProject} disabled={!isProjectValid}>
            Start Scroll
          </Button>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </div>
    </Modal>
  );
};
