import { useState } from 'react';
import Modal from '@/components/modals/base/Modal';
import { Button, Select } from '@/components/ui';
import { Callout } from '@/components/ui/core/feedback';
import { useNotificationContext } from '@/hooks';
import { getCharacterById } from '@/services';
import { generateCharacterSheetText, sanitizeFilename, formatDate } from '@/utils/characterExport';
import { downloadFile } from '@/utils/fileDownload';
import type { CharacterListItem } from '@/services';
import { logger } from '@/utils';
import './ExportCharacterModal.css';

interface ExportCharacterModalProps {
  isOpen: boolean;
  onClose: () => void;
  characters: CharacterListItem[];
  userId: string;
}

type ExportFormat = 'json' | 'txt';

const formatOptions = [
  { value: 'json', label: 'JSON (Machine-readable)' },
  { value: 'txt', label: 'TXT (Character Sheet)' },
];

export default function ExportCharacterModal({ isOpen, onClose, characters, userId }: ExportCharacterModalProps) {
  const [selectedCharacterId, setSelectedCharacterId] = useState<string | null>(null);
  const [exportFormat, setExportFormat] = useState<ExportFormat>('json');
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const notifications = useNotificationContext();

  const handleExport = async () => {
    if (!selectedCharacterId) {
      setError('Please select a character to export');
      return;
    }

    setExporting(true);
    setError(null);

    try {
      // 1. Fetch full character data
      const fullCharacter = await getCharacterById(userId, selectedCharacterId);

      if (!fullCharacter) {
        throw new Error('Character not found. Please refresh the page and try again.');
      }

      // 2. Generate export content and trigger download
      const baseFilename = `${sanitizeFilename(fullCharacter.name)}_${formatDate()}`;

      if (exportFormat === 'json') {
        const content = JSON.stringify(fullCharacter, null, 2);
        downloadFile(content, `${baseFilename}.json`, 'application/json');
      } else {
        const content = generateCharacterSheetText(fullCharacter);
        downloadFile(content, `${baseFilename}.txt`, 'text/plain');
      }

      // 3. Success
      notifications.showSuccess(`Exported ${fullCharacter.name} as ${exportFormat.toUpperCase()}`);
      onClose();
      setSelectedCharacterId(null);
      setError(null);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred while exporting the character';
      setError(errorMessage);
      logger.error('Export error:', error);
      notifications.showError(`Export failed: ${errorMessage}`);
    } finally {
      setExporting(false);
    }
  };

  const handleClose = () => {
    if (exporting) return; // Prevent closing while exporting
    setSelectedCharacterId(null);
    setError(null);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Export Character" size="md">
      <div className="modal-stack">
        {/* Character Selection */}
        <div>
          <span id="export-character-label" className="export-label">
            Select Character
          </span>
          <div role="group" aria-labelledby="export-character-label" className="export-list">
            {characters.map((char) => (
              <button
                key={char.id}
                onClick={() => setSelectedCharacterId(char.id)}
                disabled={exporting}
                className="export-pick"
                aria-pressed={selectedCharacterId === char.id}
              >
                <div className="export-pick-name">{char.name}</div>
                <div className="export-pick-meta">
                  Level {char.level} {char.class} • {char.race}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Format Selection */}
        <Select
          label="Export Format"
          options={formatOptions}
          value={exportFormat}
          onValueChange={(value) => setExportFormat(value as ExportFormat)}
          size="md"
          disabled={exporting}
        />

        {/* Error Display */}
        {error && <Callout variant="error">{error}</Callout>}

        {/* Action Buttons */}
        <div className="modal-actions">
          <Button variant="secondary" size="md" onClick={handleClose} disabled={exporting}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="md"
            onClick={handleExport}
            disabled={!selectedCharacterId || exporting}
            loading={exporting}
            loadingText="Exporting..."
            icon="clipboard"
            iconSize="sm"
          >
            Export Character
          </Button>
        </div>
      </div>
    </Modal>
  );
}
