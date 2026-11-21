import { Card, Typography } from '@/components/ui/core/display';
import { Button } from '@/components/ui/core/primitives';
import { Icon } from '@/components/ui/core/display';
import './../ScrollCreation.css';

interface EmptyStateProps {
  isOwner: boolean;
  onCreateScroll: () => void;
}

export const EmptyState = ({ isOwner, onCreateScroll }: EmptyStateProps) => {
  return (
    <Card className="scroll-empty">
      <div className="scroll-empty-icon">
        <Icon name="clipboard" size="xl" />
      </div>
      <Typography variant="body">No scrolls created yet.</Typography>
      {isOwner && <Button onClick={onCreateScroll}>Create Your First Scroll</Button>}
    </Card>
  );
};
