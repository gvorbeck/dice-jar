import { useCallback, useState } from 'react';
import { FileUpload } from '@/components/ui/core/primitives';
import { Button, Icon, Image } from '@/components/ui';
import { Card, Typography } from '@/components/ui/core/display';
import type { Character } from '@/types';
import { FILE_UPLOAD } from '@/constants';
import './AvatarSelector.css';

interface AvatarSelectorProps {
  character: Character;
  onCharacterChange: (character: Character) => void;
}

// List of stock avatars available in /public/avatars/
const STOCK_AVATARS = [
  'cleric-man-1.webp',
  'dwarf-man-1.webp',
  'elf-man-1.webp',
  'elf-woman-1.webp',
  'elf-woman-2.webp',
  'elf-woman-3.webp',
  'gnome-boy-1.webp',
  'thief-man-1.webp',
  'thief-woman-1.webp',
  'warrior-man-1.webp',
  'warrior-man-2.webp',
  'warrior-man-3.webp',
  'warrior-man-4.webp',
  'warrior-man-5.webp',
  'warrior-woman-1.webp',
  'warrior-woman-2.webp',
  'warrior-woman-3.webp',
  'wizard-man-1.webp',
  'wizard-woman-1.webp',
  'wizard-woman-3.webp',
];

function AvatarSelector({ character, onCharacterChange }: AvatarSelectorProps) {
  const [uploadError, setUploadError] = useState<string>('');

  // Determine if current avatar is a stock avatar or custom upload
  const isCustomAvatar = character.avatar && !character.avatar.startsWith('/avatars/');
  const selectedStockAvatar = character.avatar?.startsWith('/avatars/') ? character.avatar : null;

  const handleStockAvatarSelect = useCallback(
    (avatarPath: string) => {
      onCharacterChange({
        ...character,
        avatar: `/avatars/${avatarPath}`,
      });
      setUploadError('');
    },
    [character, onCharacterChange],
  );

  const handleCustomUpload = useCallback(
    (file: File | null) => {
      setUploadError('');

      if (!file) {
        return;
      }

      // Validate file type
      if (!file.type.startsWith('image/')) {
        setUploadError('Please select an image file');
        return;
      }

      // Validate file size (max 2MB for avatars)
      if (file.size > FILE_UPLOAD.AVATAR_MAX_SIZE_BYTES) {
        setUploadError(`Image must be smaller than ${FILE_UPLOAD.AVATAR_MAX_SIZE_MB}MB`);
        return;
      }

      // Create a data URL for the uploaded image
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        onCharacterChange({
          ...character,
          avatar: dataUrl,
        });
      };
      reader.onerror = () => {
        setUploadError('Failed to read the image file');
      };
      reader.readAsDataURL(file);
    },
    [character, onCharacterChange],
  );

  const handleClearAvatar = useCallback(() => {
    const updatedCharacter = { ...character };
    delete updatedCharacter.avatar;
    onCharacterChange(updatedCharacter);
    setUploadError('');
  }, [character, onCharacterChange]);

  const getAvatarDisplayName = useCallback((filename: string): string => {
    // Simply return the index position + 1 for a neutral numbering system
    const index = STOCK_AVATARS.indexOf(filename);
    return `Avatar ${index + 1}`;
  }, []);

  return (
    <div className="avatar-picker">
      <header>
        <Typography variant="sectionHeading" className="icon-heading">
          <Icon name="user" size="md" />
          Avatar
        </Typography>
        <Card variant="info" size="compact">
          <Typography variant="helper" color="amber">
            Choose a stock avatar or upload your own image to represent your character.
          </Typography>
        </Card>
      </header>

      {/* Current Avatar Preview */}
      {character.avatar && (
        <Card variant="success" className="avatar-current">
          <Typography variant="baseSectionHeading" className="icon-heading">
            <Icon name="check-circle" size="sm" />
            Current Avatar
          </Typography>
          <div className="avatar-current-row">
            <Image variant="avatar" size="lg" src={character.avatar} alt={`${character.name || 'Character'} avatar`} />
            <div>
              <div className="avatar-current-name">
                {isCustomAvatar ? 'Custom Upload' : getAvatarDisplayName(character.avatar.split('/').pop() || '')}
              </div>
              <Button variant="destructive" size="sm" onClick={handleClearAvatar}>
                Remove Avatar
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Stock Avatars */}
      <Card variant="standard">
        <Typography variant="baseSectionHeading" className="icon-heading">
          <Icon name="photo" size="sm" />
          Stock Avatars
        </Typography>
        <div className="avatar-grid">
          {STOCK_AVATARS.map((avatar) => {
            const avatarPath = `/avatars/${avatar}`;
            const isSelected = selectedStockAvatar === avatarPath;

            return (
              <Button
                key={avatar}
                variant="ghost"
                onClick={() => handleStockAvatarSelect(avatar)}
                aria-label={`Select ${getAvatarDisplayName(avatar)} avatar`}
                className="avatar-pick"
                data-selected={isSelected || undefined}
              >
                <Image
                  variant="standard"
                  src={avatarPath}
                  alt={getAvatarDisplayName(avatar)}
                  fallback={
                    <div className="avatar-missing">
                      <span>N/A</span>
                    </div>
                  }
                />
                {isSelected && (
                  <div className="avatar-check">
                    <Icon name="check" size="xs" />
                  </div>
                )}
              </Button>
            );
          })}
        </div>
      </Card>

      {/* Custom Upload */}
      <Card variant="standard">
        <Typography variant="baseSectionHeading" className="icon-heading">
          <Icon name="upload" size="sm" />
          Upload Custom Avatar
        </Typography>
        <FileUpload
          label="Upload Avatar Image"
          helperText={`Upload your own avatar image. Accepts JPG, PNG, WebP. Max ${FILE_UPLOAD.AVATAR_MAX_SIZE_MB}MB.`}
          accept="image/jpeg,image/png,image/webp"
          maxSizeBytes={FILE_UPLOAD.AVATAR_MAX_SIZE_BYTES}
          onFileSelect={handleCustomUpload}
          error={uploadError}
          aria-describedby="avatar-upload-info"
        />
        <Card variant="info" size="compact" className="avatar-tip">
          <Typography variant="helper" color="amber">
            For best results, use a square image (1:1 aspect ratio) that's at least 128x128 pixels.
          </Typography>
        </Card>
      </Card>
    </div>
  );
}

export default AvatarSelector;
