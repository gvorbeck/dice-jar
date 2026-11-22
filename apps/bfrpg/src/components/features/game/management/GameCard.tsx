import { Typography } from '@/components/ui';
import { BaseCard } from '@/components/ui/composite/BaseCard';
import { StatusDot, StatCard } from '@/components/ui/composite';
import type { Game } from '@/types';
import { useCopy } from '@dice-jar/browser';
import { useToast } from '@dice-jar/browser';
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
  const { addToast } = useToast();
  const [, copy] = useCopy();
  const href = `/u/${user?.uid}/g/${game.id}`;

  const handleCopyUrl = async (url: string, gameName: string) => {
    if (await copy(url)) addToast(`Game URL copied for ${gameName}`, 'success');
    else addToast('Failed to copy URL to clipboard', 'error');
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
          <Typography variant="h4" as="h3" className="char-name">
            {game.name}
          </Typography>
        </div>
      </div>

      {/* Game Notes */}
      {game.notes && (
        <div>
          <div className="game-notes">
            <div className="game-notes-head">
              <StatusDot status="active" ariaLabel="Game notes section" />
              <Typography variant="helper" className="char-kind-label">
                Notes
              </Typography>
            </div>
            <Typography variant="body">{truncateText(game.notes)}</Typography>
          </div>
        </div>
      )}

      {/* Game Stats */}
      {game.players && game.players.length > 0 && (
        <div className="game-stats">
          <StatCard label="Players" value={game.players.length} size="sm" fullName="Number of players in this game" />
        </div>
      )}
    </BaseCard>
  );
}
