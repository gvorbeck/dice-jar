import { Button } from '@/components/ui';
import './LevelUp.css';

interface ActionButtonsProps {
  canLevelUp: boolean;
  hasRequiredXP: boolean;
  isProcessing: boolean;
  onClose: () => void;
  onLevelUp: () => void;
}

export default function ActionButtons({ canLevelUp, hasRequiredXP, isProcessing, onClose, onLevelUp }: ActionButtonsProps) {
  return (
    <div className="levelup-actions">
      <Button variant="secondary" onClick={onClose} disabled={isProcessing}>
        Cancel
      </Button>
      <Button
        variant="primary"
        onClick={onLevelUp}
        disabled={!canLevelUp || isProcessing}
        loading={isProcessing}
        loadingText="Leveling up..."
        className="levelup-confirm"
      >
        {hasRequiredXP ? 'Level Up!' : 'Not Ready'}
      </Button>
    </div>
  );
}
