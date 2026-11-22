import { useState } from 'react';
import Modal from '@/components/modals/base/Modal';
import { FileUpload, Button, Accordion } from '@/components/ui';
import { Callout } from '@/components/ui/core/feedback';
import { useCharacterMutations } from '@/hooks/mutations/useEnhancedMutations';
import { useRun, useToast } from '@dice-jar/browser';
import { getErrorMessage } from '@/utils';
import { processCharacterData } from '@/services/characterMigration';
import { characterSchema, problemWith } from '@/services/documentSchemas';
import { validateImportedCharacter } from '@/validation/character';
import type { Character } from '@/types';
import './ImportCharacterModal.css';

interface ImportCharacterModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
}

const EXAMPLE_CHARACTER = `{
  "name": "Thorin Oakenshield",
  "race": "dwarf",
  "class": "fighter",
  "level": 1,
  "xp": 0,
  "abilities": {
    "strength": { "value": 16, "modifier": 2 },
    "dexterity": { "value": 12, "modifier": 0 },
    "constitution": { "value": 15, "modifier": 1 },
    "intelligence": { "value": 10, "modifier": 0 },
    "wisdom": { "value": 13, "modifier": 1 },
    "charisma": { "value": 14, "modifier": 1 }
  },
  "hp": { "current": 8, "max": 8, "die": "1d8" },
  "currency": { "gold": 100 },
  "equipment": [],
  "schemaVersion": 3
}`;

export default function ImportCharacterModal({ isOpen, onClose, userId }: ImportCharacterModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const { busy: importing, err: error, run, clear } = useRun((e) => getErrorMessage(e, 'An unknown error occurred'));
  const { saveCharacter } = useCharacterMutations();
  const { addToast } = useToast();

  const handleFileSelect = (file: File | null) => {
    setSelectedFile(file);
    clear(); // Clear any previous errors
  };

  const handleImport = async () => {
    await run(async () => {
      if (!selectedFile) throw new Error('Please select a file to import');

      // 1. Read and parse the file
      const text = await selectedFile.text();
      let rawData: unknown;

      try {
        rawData = JSON.parse(text);
      } catch {
        throw new Error('Invalid file format. Please upload a valid JSON file.');
      }

      // 2. Migrate and process data
      let migratedCharacter: Character;
      try {
        migratedCharacter = processCharacterData(rawData);
      } catch (migrationError) {
        console.error('Migration error:', migrationError);
        throw new Error('Unable to process character data. The file may be corrupted or use an incompatible format.');
      }

      // 3. Validate: the schema for structure, then the book's ranges
      const problem = problemWith(characterSchema, migratedCharacter);
      if (problem) throw new Error(`Character data validation failed: ${problem}`);
      const validationResult = validateImportedCharacter(migratedCharacter);
      if (!validationResult.isValid) {
        throw new Error(`Character data validation failed: ${validationResult.errors.join(', ')}`);
      }

      // 4. Save character (without ID to create new)
      // No characterId = create new character
      const id = await saveCharacter({ userId, character: migratedCharacter });
      if (id === undefined) throw new Error('Failed to save character. Please try again.');
      addToast(`Successfully imported ${migratedCharacter.name}`, 'success');
      onClose();
      setSelectedFile(null);
    });
  };

  const handleClose = () => {
    if (importing) return; // Prevent closing while importing
    setSelectedFile(null);
    clear();
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Import Character" size="lg">
      <div className="modal-stack">
        {/* File Upload */}
        <FileUpload
          label="Select Character File"
          helperText="Upload a JSON file containing character data (max 1MB)"
          accept=".json,application/json"
          maxSizeBytes={1024 * 1024} // 1MB
          onFileSelect={handleFileSelect}
          disabled={importing}
        />

        {/* Error Display */}
        {error && <Callout variant="error">{error}</Callout>}

        {/* Example JSON Structure */}
        <Accordion
          items={[
            {
              id: 'example',
              name: 'Example Character Format',
              content: EXAMPLE_CHARACTER,
            },
          ]}
          sortBy="id"
          labelProperty="name"
          renderItem={(item) => (
            <pre className="import-example">
              <code>{String(item.content)}</code>
            </pre>
          )}
          showCounts={false}
          showSearch={false}
        />

        {/* Action Buttons */}
        <div className="modal-actions">
          <Button variant="secondary" size="md" onClick={handleClose} disabled={importing}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="md"
            onClick={handleImport}
            disabled={!selectedFile || importing}
            loading={importing}
            loadingText="Importing..."
            icon="upload"
            iconSize="sm"
          >
            Import Character
          </Button>
        </div>
      </div>
    </Modal>
  );
}
