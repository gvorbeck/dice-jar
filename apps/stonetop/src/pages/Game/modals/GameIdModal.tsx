import { useId, useState } from 'react';
import { useCopy } from '@dice-jar/browser';
import { Button, Heading, Modal, Text } from '@/ui';

interface GameIdModalProps {
  gameId: string;
  open: boolean;
  onClose: () => void;
}

export const GameIdModal = ({ gameId, open, onClose }: GameIdModalProps) => {
  const headingId = useId();
  // The parent mounts this modal only while open, so copy feedback resets
  // naturally on each open — no reset effect needed.
  const [copyState, copy] = useCopy();
  const [copyFailed, setCopyFailed] = useState(false); // stays up: this is the one place a player must save the ID
  const copied = copyState === 'ok';

  return (
    <Modal open={open} onClose={onClose} aria-labelledby={headingId}>
      <Heading as="h2" size="md" id={headingId}>
        Your Game ID
      </Heading>

      <div className="game-id-modal-id-row">
        <Text as="span" color="accent" className="game-id-modal-id-text">
          {gameId}
        </Text>
        <Button
          variant="ghost"
          size="sm"
          icon={copied ? 'check' : 'copy'}
          onClick={() => void copy(gameId).then((ok) => setCopyFailed(!ok))}
          aria-label={copied ? 'Copied!' : 'Copy game ID'}
          title={copied ? 'Copied!' : 'Copy game ID'}
        />
      </div>

      {copyFailed && (
        <Text size="xs" color="muted" role="alert">
          Could not copy — please copy the ID manually.
        </Text>
      )}

      <div className="game-id-modal-warning">
        <Text size="xs" color="muted">
          <strong className="game-id-modal-warning-label">Save this ID somewhere safe.</strong> It's the only way to access this game. If
          you lose it, there's no way to recover it.
        </Text>
      </div>

      <Button type="button" onClick={onClose} size="md">
        Got it
      </Button>
    </Modal>
  );
};
