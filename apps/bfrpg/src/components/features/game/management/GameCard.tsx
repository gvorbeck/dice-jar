import { Typography } from '@/components/ui';
import { BaseCard } from '@/components/ui/composite/BaseCard';
import { StatusDot, StatCard } from '@/components/ui/composite';
import type { Game } from '@/types';
import { useNotificationContext } from '@/hooks';
import { truncateText } from '@/utils';
import '@/components/features/character/management/CharacterCard.css';
import './GameCard.css';

interface GameCardProps {
  game: Game;
  user: { uid: string } | null;
  onDelete: (gameId: string, gameName: string) => void;
  isDeleting?: boolean;
}

export function GameCard({ game, user, onDelete, isDeleting }: GameCardProps) {
  const { showSuccess, showError } = useNotificationContext();
  const href = `/u/${user?.uid}/g/${game.id}`;

  const handleCopyUrl = async (url: string, gameName: string) => {
    try {
      await navigator.clipboard.writeText(url);
      showSuccess(`Game URL copied for ${gameName}`, {
        duration: 3000,
      });
    } catch {
      showError('Failed to copy URL to clipboard', {
        duration: 5000,
      });
    }
  };

  return (
    <BaseCard
      id={game.id}
      name={game.name}
      user={user}
      href={href}
      onDelete={onDelete}
      onCopy={handleCopyUrl}
      isDeleting={isDeleting || false}
    >
      {/* Game Header */}
      <div className="char-head">
        <div>
          <Typography variant="h4" className="char-name">
            {game.name}
          </Typography>
        </div>
      </div>

      {/* Game Notes */}
      {game.notes && (
        <section aria-labelledby={`game-${game.id}-notes-label`}>
          <div className="game-notes">
            <div className="game-notes-head">
              <StatusDot status="active" ariaLabel="Game notes section" />
              <Typography id={`game-${game.id}-notes-label`} variant="helper" className="char-kind-label">
                Notes
              </Typography>
            </div>
            <Typography variant="body">{truncateText(game.notes)}</Typography>
          </div>
        </section>
      )}

      {/* Game Stats */}
      {game.players && game.players.length > 0 && (
        <section aria-labelledby={`game-${game.id}-stats-label`} className="game-stats">
          <StatCard label="Players" value={game.players.length} size="sm" fullName="Number of players in this game" />
        </section>
      )}
    </BaseCard>
  );
}
