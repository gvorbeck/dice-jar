import { forwardRef, useState, useRef, useEffect } from 'react';
import type { HTMLAttributes } from 'react';
import type { Character } from '@/types';
import { AvatarChangeModal, SettingsModal } from '@/components/modals';
import { TextInput, Button } from '@/components/ui/core/primitives';
import { Details } from '@/components/ui/composite';
import { Icon, Image, Typography } from '@/components/ui/core/display';
import { cn } from '@dice-jar/cn';
import { getClassName, isCustomRace, getRaceById } from '@/utils';

import './Hero.css';

type HeroSize = 'sm' | 'md' | 'lg';

interface HeroProps extends HTMLAttributes<HTMLDivElement> {
  character: Character;
  size?: HeroSize;
  editable?: boolean;
  onCharacterChange?: (character: Character) => void;
}

// Helper functions moved outside component for better performance
const getRaceDisplayName = (character: Character): string => {
  if (!character.race) return 'Unknown';

  if (isCustomRace(character.race)) {
    return character.race;
  }

  const race = getRaceById(character.race);
  return race?.name || character.race;
};

const getClassDisplayNames = (character: Character): string => {
  if (!character.class) return 'Unknown';
  return getClassName(character, character.class);
};

const getAvatarFallback = (name: string): string => {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

const getCharacterDetails = (character: Character) => [
  {
    label: 'Race',
    children: <span>{getRaceDisplayName(character)}</span>,
  },
  {
    label: 'Class',
    children: <span>{getClassDisplayNames(character)}</span>,
  },
  {
    label: 'Level',
    children: <span>{character.level}</span>,
  },
];

const Hero = forwardRef<HTMLDivElement, HeroProps>(
  ({ character, size = 'md', className, editable = false, onCharacterChange, ...props }, ref) => {
    const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
    const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
    const [isEditingName, setIsEditingName] = useState(false);
    const [nameValue, setNameValue] = useState(character.name);
    const [prevCharacterName, setPrevCharacterName] = useState(character.name);
    const nameInputRef = useRef<HTMLInputElement>(null);

    const isEditable = editable && onCharacterChange;

    // Sync local name value when character prop changes during render
    if (character.name !== prevCharacterName) {
      setPrevCharacterName(character.name);
      setNameValue(character.name);
    }

    // Focus input when entering edit mode
    useEffect(() => {
      if (isEditingName && nameInputRef.current) {
        nameInputRef.current.focus();
        nameInputRef.current.select();
      }
    }, [isEditingName]);

    const handleNameClick = () => {
      if (isEditable && !isEditingName) {
        setIsEditingName(true);
      }
    };

    const handleNameChange = (newName: string) => {
      setNameValue(newName);
    };

    const handleNameSubmit = () => {
      if (nameValue.trim() && nameValue.trim() !== character.name && onCharacterChange) {
        onCharacterChange({
          ...character,
          name: nameValue.trim(),
        });
      }
      setIsEditingName(false);
    };

    const handleNameCancel = () => {
      setNameValue(character.name);
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

    // Determine TextInput size based on Hero size
    let textInputSize: HeroSize = 'md';
    if (size === 'sm') {
      textInputSize = 'sm';
    } else if (size === 'lg') {
      textInputSize = 'lg';
    }

    return (
      <>
        <header ref={ref} className={cn('hero-card', className)} data-size={size} aria-labelledby="hero-character-name" {...props}>
          {isEditable && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsSettingsModalOpen(true)}
              className="hero-settings"
              aria-label="Open character settings"
              title="Settings"
              icon="settings"
              iconSize="md"
            />
          )}

          {/* Mobile: Stack vertically, Desktop: Horizontal layout */}
          <div className="hero-layout">
            {/* Avatar with edit functionality */}
            <div className="avatar-edit">
              <div className="hero-avatar" aria-hidden="true">
                {character.avatar ? (
                  <Image variant="standard" src={character.avatar} alt="" fallback={getAvatarFallback(character.name)} />
                ) : (
                  <div className="hero-initials" aria-hidden="true">
                    {getAvatarFallback(character.name)}
                  </div>
                )}
              </div>

              {isEditable && (
                <Button
                  variant="ghost"
                  className="avatar-overlay"
                  onClick={() => setIsAvatarModalOpen(true)}
                  aria-label="Change avatar"
                  icon="edit"
                  iconSize="lg"
                />
              )}
            </div>

            {/* Character Info */}
            <div className="hero-info">
              {isEditingName ? (
                <div className="hero-rename">
                  <TextInput
                    ref={nameInputRef}
                    value={nameValue}
                    onChange={handleNameChange}
                    onBlur={handleNameSubmit}
                    onKeyDown={handleNameKeyDown}
                    maxLength={50}
                    size={textInputSize}
                    aria-label="Edit character name"
                  />
                  <div className="hero-rename-hint">
                    <span>Press Enter to save, Escape to cancel</span>
                  </div>
                </div>
              ) : (
                <div className="hero-name-row">
                  {isEditable ? (
                    <button onClick={handleNameClick} className="hero-name" data-editable aria-label="Click to edit character name">
                      <Typography as="h1" variant="h1" color="primary" weight="bold" id="hero-character-name">
                        {character.name}
                      </Typography>
                    </button>
                  ) : (
                    <Typography as="h1" variant="h1" color="primary" weight="bold" id="hero-character-name" className="hero-name">
                      {character.name}
                    </Typography>
                  )}

                  {isEditable && (
                    <div className="hero-edit-icon">
                      <Icon name="edit" size="md" aria-hidden={true} />
                    </div>
                  )}
                </div>
              )}

              {/* Character Details */}
              <div className="hero-details">
                <div className="hero-details-narrow">
                  <Details layout="vertical" items={getCharacterDetails(character)} />
                </div>
                <div className="hero-details-wide">
                  <Details layout="horizontal" items={getCharacterDetails(character)} />
                </div>
              </div>
            </div>
          </div>
        </header>

        {isEditable && (
          <>
            <AvatarChangeModal
              isOpen={isAvatarModalOpen}
              onClose={() => setIsAvatarModalOpen(false)}
              character={character}
              onCharacterChange={onCharacterChange}
            />
            <SettingsModal
              isOpen={isSettingsModalOpen}
              onClose={() => setIsSettingsModalOpen(false)}
              character={character}
              onCharacterChange={onCharacterChange}
            />
          </>
        )}
      </>
    );
  },
);

Hero.displayName = 'Hero';

export default Hero;
