import { useState, useCallback, useMemo } from 'react';
import { Modal } from '@/components/modals';
import { Button, Select } from '@/components/ui/core/primitives';
import { Typography, Card } from '@/components/ui/core/display';
import { Icon, List, GridListItem, type IconName } from '@/components/ui/composite';
import { ErrorBoundary } from '@dice-jar/browser';
import { LoadingState } from '@/components/ui/core/feedback';
import { useNotificationContext } from '@/hooks';
import { generateTreasure, formatTreasureResult, logger, getCoinsToDisplay, hasCoins } from '@/utils';
import { TREASURE_TYPES, LAIR_TREASURE_TYPES, INDIVIDUAL_TREASURE_TYPES, UNGUARDED_TREASURE_LEVELS } from '@/constants';
import type { IndividualTreasureType, LairTreasureType, TreasureResult, TreasureType, UnguardedTreasureLevel } from '@/types';
import '../GameButtons.css';
import './TreasureGeneratorModal.css';

interface TreasureGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Constants moved to @/constants/treasureTypes

export default function TreasureGeneratorModal({ isOpen, onClose }: TreasureGeneratorModalProps) {
  const [treasureType, setTreasureType] = useState<TreasureType>('lair');
  const [lairType, setLairType] = useState<LairTreasureType>('A');
  const [individualType, setIndividualType] = useState<IndividualTreasureType>('P');
  const [unguardedLevel, setUnguardedLevel] = useState<UnguardedTreasureLevel>(1);
  const [generatedTreasure, setGeneratedTreasure] = useState<TreasureResult | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { showSuccess, showError } = useNotificationContext();

  // Memoize treasure configuration for performance
  const treasureConfig = useMemo(
    () => ({
      type: treasureType,
      subtype: treasureType === 'lair' ? lairType : treasureType === 'individual' ? individualType : unguardedLevel,
    }),
    [treasureType, lairType, individualType, unguardedLevel],
  );

  const handleGenerate = useCallback(async () => {
    setIsGenerating(true);
    setError(null); // Clear previous errors

    try {
      const treasure = generateTreasure(treasureConfig.type, treasureConfig.subtype);
      setGeneratedTreasure(treasure);

      // Provide success feedback
      showSuccess('Treasure generated successfully!', {
        duration: 3000,
      });
    } catch (error) {
      logger.error('Error generating treasure:', error);
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred while generating treasure';
      setError(errorMessage);

      showError('Failed to generate treasure. Please try again.', {
        title: 'Generation Error',
        duration: 5000,
      });
    } finally {
      setIsGenerating(false);
    }
  }, [treasureConfig, showSuccess, showError]);

  const handleCopy = useCallback(async () => {
    if (!generatedTreasure) return;

    const formattedText = formatTreasureResult(generatedTreasure);

    try {
      await navigator.clipboard.writeText(formattedText);
      showSuccess('Treasure copied to clipboard!', {
        duration: 3000,
      });
    } catch (error) {
      logger.error('Failed to copy treasure:', error);

      try {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = formattedText;
        textArea.style.position = 'fixed';
        textArea.style.opacity = '0';
        document.body.appendChild(textArea);
        textArea.select();
        const success = document.execCommand('copy');
        document.body.removeChild(textArea);

        if (success) {
          showSuccess('Treasure copied to clipboard!', {
            duration: 3000,
          });
        } else {
          throw new Error('Fallback copy failed');
        }
      } catch {
        showError('Failed to copy treasure to clipboard. Please select and copy manually.', {
          title: 'Copy Failed',
          duration: 5000,
        });
      }
    }
  }, [generatedTreasure, showSuccess, showError]);

  const handleReset = useCallback(() => {
    setGeneratedTreasure(null);
  }, []);

  const handleClose = useCallback(() => {
    setGeneratedTreasure(null);
    setError(null);
    onClose();
  }, [onClose]);

  // Memoize coins to display for performance
  const coinsToDisplay = useMemo(() => (generatedTreasure ? getCoinsToDisplay(generatedTreasure) : []), [generatedTreasure]);

  const shouldShowCoins = useMemo(() => (generatedTreasure ? hasCoins(generatedTreasure) : false), [generatedTreasure]);

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Treasure Generator" size="lg">
      <div className="treasure">
        {/* Treasure Type Selection */}
        <div className="treasure-types">
          <Typography variant="h3" weight="semibold">
            Select Treasure Type
          </Typography>

          <div className="treasure-kinds" role="radiogroup" aria-label="Treasure type selection">
            {TREASURE_TYPES.map((type) => (
              <Button
                key={type.value}
                variant={treasureType === type.value ? 'primary' : 'secondary'}
                size="md"
                onClick={() => setTreasureType(type.value as TreasureType)}
                icon={type.icon as IconName}
                iconSize="sm"
                role="radio"
                aria-checked={treasureType === type.value}
                aria-label={`Select ${type.label}`}
              >
                <span>{type.label}</span>
              </Button>
            ))}
          </div>
        </div>

        {/* Subtype Selection */}
        <div className="treasure-subtype">
          <Typography variant="body" weight="medium" color="primary">
            {treasureType === 'lair' && 'Select Lair Type'}
            {treasureType === 'individual' && 'Select Individual Type'}
            {treasureType === 'unguarded' && 'Select Treasure Level'}
          </Typography>

          {treasureType === 'lair' && (
            <Select
              label="Lair Type"
              value={lairType}
              onValueChange={(value) => setLairType(value as LairTreasureType)}
              options={LAIR_TREASURE_TYPES.map((t) => ({
                value: t.value,
                label: t.label,
              }))}
              placeholder="Choose a lair type..."
            />
          )}

          {treasureType === 'individual' && (
            <Select
              label="Individual Type"
              value={individualType}
              onValueChange={(value) => setIndividualType(value as IndividualTreasureType)}
              options={INDIVIDUAL_TREASURE_TYPES.map((t) => ({
                value: t.value,
                label: t.label,
              }))}
              placeholder="Choose an individual type..."
            />
          )}

          {treasureType === 'unguarded' && (
            <Select
              label="Treasure Level"
              value={unguardedLevel.toString()}
              onValueChange={(value) => setUnguardedLevel(parseInt(value) as UnguardedTreasureLevel)}
              options={UNGUARDED_TREASURE_LEVELS.map((t) => ({
                value: t.value.toString(),
                label: t.label,
              }))}
              placeholder="Choose a treasure level..."
            />
          )}
        </div>

        {/* Error Display */}
        {error && (
          <div className="treasure-error" id="generation-error">
            <div className="treasure-error-head">
              <Icon name="exclamation-triangle" size="sm" />
              <Typography variant="bodySmall" weight="semibold">
                Error generating treasure
              </Typography>
            </div>
            <Typography variant="bodySmall">{error}</Typography>
          </div>
        )}

        {/* Generate Button */}
        <div className="treasure-center">
          <Button
            variant="primary"
            size="lg"
            onClick={handleGenerate}
            disabled={isGenerating}
            className="generate-button"
            icon="dice"
            iconSize="md"
            data-busy={isGenerating || undefined}
            aria-label="Generate treasure"
            title="Generate treasure"
            aria-describedby={error ? 'generation-error' : undefined}
          />
        </div>

        {/* Loading State */}
        {isGenerating && (
          <div className="treasure-center">
            <LoadingState variant="inline" message="Generating treasure..." />
          </div>
        )}

        {/* Generated Treasure Result */}
        {generatedTreasure && (
          <ErrorBoundary
            fallback={
              <Card className="treasure-fallback">
                <div className="treasure-fallback-body">
                  <Icon name="exclamation-triangle" size="md" />
                  <Typography variant="h6" color="secondary" weight="semibold">
                    Error Displaying Treasure
                  </Typography>
                  <Typography variant="bodySmall">
                    There was a problem displaying the generated treasure. The treasure data may be corrupted.
                  </Typography>
                  <Button variant="secondary" size="sm" onClick={handleReset}>
                    Try Again
                  </Button>
                  <Button variant="primary" size="sm" onClick={handleGenerate}>
                    Generate New
                  </Button>
                </div>
              </Card>
            }
          >
            <Card className="treasure-result">
              <div className="treasure-result-body">
                <div className="treasure-result-head">
                  <Typography variant="h3" weight="bold" color="primary">
                    {generatedTreasure.description}
                  </Typography>
                  <div>
                    <Button variant="ghost" size="sm" onClick={handleCopy} icon="copy" iconSize="sm" title="Copy treasure to clipboard" />
                    <Button variant="ghost" size="sm" onClick={handleReset} icon="close" iconSize="sm" title="Clear treasure result" />
                  </div>
                </div>

                {/* Coins */}
                {shouldShowCoins && (
                  <div className="treasure-section">
                    <Typography variant="body" weight="semibold">
                      Coins:
                    </Typography>
                    <div className="treasure-grid" data-kind="coins" role="list" aria-label="Coin amounts">
                      {coinsToDisplay.map((coin) => (
                        <div key={coin.key} className="treasure-chip" data-coin={coin.key} role="listitem">
                          <Icon name="coin" size="xs" aria-hidden={true} />
                          <span aria-label={`${coin.amount} ${coin.key} pieces`}>
                            {coin.amount} {coin.label}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Gems & Jewelry */}
                {generatedTreasure.gemsAndJewelry.length > 0 && (
                  <div className="treasure-section">
                    <Typography variant="body" weight="semibold">
                      Gems & Jewelry:
                    </Typography>
                    <div className="treasure-grid" data-wide={generatedTreasure.gemsAndJewelry.length > 6 ? 'gem' : undefined}>
                      {generatedTreasure.gemsAndJewelry.map((item, index) => (
                        <div key={index} className="treasure-chip" data-kind="gem">
                          <Icon name="star" size="xs" />
                          <span>{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Magic Items */}
                {generatedTreasure.magicItems.length > 0 && (
                  <div className="treasure-section">
                    <Typography variant="body" weight="semibold">
                      Magic Items:
                    </Typography>
                    <div className="treasure-grid" data-wide={generatedTreasure.magicItems.length > 4 ? 'magic' : undefined}>
                      {generatedTreasure.magicItems.map((item, index) => (
                        <div key={index} className="treasure-chip" data-kind="magic">
                          <Icon name="lightning" size="xs" />
                          <span>{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Generation Details */}
                {generatedTreasure.breakdown.length > 0 && (
                  <details className="treasure-details">
                    <summary>Generation Details</summary>
                    <div className="treasure-details-body">
                      <List variant="grid" spacing="tight" size="sm">
                        {generatedTreasure.breakdown.map((detail, index) => (
                          <GridListItem key={index}>{detail}</GridListItem>
                        ))}
                      </List>
                    </div>
                  </details>
                )}
              </div>
            </Card>
          </ErrorBoundary>
        )}
      </div>
    </Modal>
  );
}
