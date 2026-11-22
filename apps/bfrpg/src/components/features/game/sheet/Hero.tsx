import { forwardRef, useState, useRef, useEffect } from 'react';
import type { HTMLAttributes } from 'react';
import type { Game } from '@/types';
import { TextInput, Button } from '@/components/ui/core/primitives';
import { Icon } from '@/components/ui/core/display';
import { Typography } from '@/components/ui/core/display';
import { cn } from '@dice-jar/cn';
import '../GameButtons.css';
import '@/components/features/character/sheet/Hero.css';

interface GameHeroProps extends HTMLAttributes<HTMLDivElement> {
  game: Game;
  size?: 'sm' | 'md' | 'lg';
  editable?: boolean;
  onGameChange?: (game: Game) => void;
  onTreasureGenerate?: () => void;
  onCombatTrackerOpen?: () => void;
  onEncounterGeneratorOpen?: () => void;
}

const GameHero = forwardRef<HTMLDivElement, GameHeroProps>(
  (
    {
      game,
      size = 'md',
      className,
      editable = false,
      onGameChange,
      onTreasureGenerate,
      onCombatTrackerOpen,
      onEncounterGeneratorOpen,
      ...props
    },
    ref,
  ) => {
    const [isEditingName, setIsEditingName] = useState(false);
    const [nameValue, setNameValue] = useState(game.name);
    const [prevGameName, setPrevGameName] = useState(game.name);
    const nameInputRef = useRef<HTMLInputElement>(null);

    // Sync local name value when game prop changes during render
    if (game.name !== prevGameName) {
      setPrevGameName(game.name);
      setNameValue(game.name);
    }

    // Focus input when entering edit mode
    useEffect(() => {
      if (isEditingName && nameInputRef.current) {
        nameInputRef.current.focus();
        nameInputRef.current.select();
      }
    }, [isEditingName]);

    const handleNameClick = () => {
      if (editable && onGameChange && !isEditingName) {
        setIsEditingName(true);
      }
    };

    const handleNameChange = (newName: string) => {
      setNameValue(newName);
    };

    const handleNameSubmit = () => {
      if (nameValue.trim() && nameValue.trim() !== game.name && onGameChange) {
        onGameChange({
          ...game,
          name: nameValue.trim(),
        });
      }
      setIsEditingName(false);
    };

    const handleNameCancel = () => {
      setNameValue(game.name);
      setIsEditingName(false);
    };

    const handleNameKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleNameSubmit();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        handleNameCancel();
      }
    };

    return (
      <>
        <div
          ref={ref}
          className={cn('hero-card', className)}
          data-size={size}
          data-theme="lime"
          role="banner"
          aria-labelledby="hero-game-name"
          {...props}
        >
          {/* Mobile: Stack vertically, Desktop: Horizontal layout */}
          <div className="hero-layout">
            {/* Game Icon */}
            <div className="avatar-edit">
              <div className="hero-avatar" aria-hidden="true">
                <Icon name="dice" size={size === 'sm' ? 'lg' : 'xl'} aria-hidden={true} />
              </div>
            </div>

            {/* Game Info */}
            <div className="hero-info">
              {isEditingName ? (
                <div role="presentation" className="hero-rename" onKeyDown={handleNameKeyDown}>
                  <TextInput
                    ref={nameInputRef}
                    value={nameValue}
                    onChange={handleNameChange}
                    onBlur={handleNameSubmit}
                    maxLength={100}
                    size={size === 'sm' ? 'sm' : size === 'lg' ? 'lg' : 'md'}
                    aria-label="Edit game name"
                  />
                  <div className="hero-rename-hint">
                    <span>Press Enter to save, Escape to cancel</span>
                  </div>
                </div>
              ) : (
                <div className="hero-name-row" data-clickable={(editable && onGameChange) || undefined}>
                  <Typography
                    as="h1"
                    variant="h1"
                    color="primary"
                    weight="bold"
                    id="hero-game-name"
                    className="hero-name"
                    data-clickable={(editable && onGameChange) || undefined}
                    onClick={handleNameClick}
                    onKeyDown={(e) => {
                      if ((e.key === 'Enter' || e.key === ' ') && editable && onGameChange) {
                        e.preventDefault();
                        handleNameClick();
                      }
                    }}
                    tabIndex={editable && onGameChange ? 0 : undefined}
                    role={editable && onGameChange ? 'button' : undefined}
                    aria-label={editable && onGameChange ? 'Click to edit game name' : undefined}
                  >
                    {game.name}
                  </Typography>

                  {/* Edit icon - shows on hover when editable */}
                  {editable && onGameChange && (
                    <div className="hero-edit-icon">
                      <Icon name="edit" size="md" aria-hidden={true} />
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Action Buttons */}
            {editable && (onTreasureGenerate || onCombatTrackerOpen || onEncounterGeneratorOpen) && (
              <div className="game-hero-tools">
                {onCombatTrackerOpen && (
                  <div className="game-hero-tools-wide">
                    <Button
                      variant="secondary"
                      size="md"
                      onClick={onCombatTrackerOpen}
                      className="game-hero-tool"
                      icon="sword"
                      iconSize={size === 'sm' ? 'sm' : 'md'}
                      aria-label="Open combat tracker"
                      title="Combat tracker"
                    />
                  </div>
                )}
                {onEncounterGeneratorOpen && (
                  <Button
                    variant="secondary"
                    size="md"
                    onClick={onEncounterGeneratorOpen}
                    className="game-hero-tool"
                    icon="map-pin"
                    iconSize={size === 'sm' ? 'sm' : 'md'}
                    aria-label="Generate random encounters"
                    title="Encounter generator"
                  />
                )}
                {onTreasureGenerate && (
                  <Button
                    variant="secondary"
                    size="md"
                    onClick={onTreasureGenerate}
                    className="game-hero-tool"
                    icon="coin"
                    iconSize={size === 'sm' ? 'sm' : 'md'}
                    aria-label="Generate treasure"
                    title="Generate treasure"
                  />
                )}
              </div>
            )}
          </div>
        </div>
      </>
    );
  },
);

GameHero.displayName = 'GameHero';

export default GameHero;
