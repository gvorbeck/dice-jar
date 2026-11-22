import { memo } from 'react';
import { Typography } from '@/components/ui/core/display';
import { Icon } from '@/components/ui/core/display';
import './GameSheetEmptyState.css';

interface GameSheetEmptyStateProps {
  gameName?: string;
}

export const GameSheetEmptyState = memo(({ gameName }: GameSheetEmptyStateProps) => (
  <div className="game-ready">
    <div className="game-ready-icon">
      <Icon name="dice" size="xl" aria-label="Game dice" />
    </div>
    <Typography variant="h2" as="h2" weight="bold">
      Ready to Play{gameName ? ` ${gameName}` : ''}!
    </Typography>
    <Typography variant="body" color="secondary">
      This game is set up and ready. Players and combatants will appear here once added.
    </Typography>
  </div>
));

GameSheetEmptyState.displayName = 'GameSheetEmptyState';
