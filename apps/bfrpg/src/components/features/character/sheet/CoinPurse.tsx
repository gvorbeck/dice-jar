import { EditableValue } from '@/components/ui/core/primitives';
import { SectionWrapper } from '@/components/ui/core/layout';
import { Card } from '@/components/ui/core/display';
import { Icon } from '@/components/ui/core/display';
import { normalizeCurrency, hasFractionalCurrency } from '@/utils/currency';
import { CURRENCY_UI_CONFIG } from '@/constants';
import type { CurrencyKey, Character } from '@/types';
import { useEffect } from 'react';
import './CoinPurse.css';

interface CoinPurseProps {
  character: Character;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  editable?: boolean;
  onCurrencyChange?: (currency: Partial<Character['currency']>) => void;
}

export default function CoinPurse({ character, className = '', size = 'md', editable = false, onCurrencyChange }: CoinPurseProps) {
  // Auto-normalize fractional currency when component mounts (BFRPG compliance)
  useEffect(() => {
    if (hasFractionalCurrency(character.currency) && onCurrencyChange) {
      const normalizedCurrency = normalizeCurrency(character.currency);
      onCurrencyChange(normalizedCurrency);
    }
  }, [character.currency, onCurrencyChange]);

  const handleCurrencyChange = (currencyType: CurrencyKey) => (value: number) => {
    if (!onCurrencyChange) return;

    // Update the specific currency type
    const updatedCurrency = {
      ...character.currency,
      [currencyType]: Math.max(0, value),
    };

    // Normalize to ensure BFRPG compliance (no fractional pieces)
    const normalizedCurrency = normalizeCurrency(updatedCurrency);
    onCurrencyChange(normalizedCurrency);
  };

  return (
    <SectionWrapper title="Coin Purse" size={size} className={className}>
      <div className="sheet-pad" data-size={size}>
        <div className="coin-grid">
          {CURRENCY_UI_CONFIG.map(({ key, label, abbrev }) => {
            const value = character.currency[key] || 0;
            // BFRPG Rule: Currency is always whole numbers (discrete pieces)

            return (
              <Card key={key} variant="nested" size="compact" className="coin" data-coin={key}>
                <div className="coin-face">
                  {/* Header with coin icon and label */}
                  <div className="coin-head">
                    <Icon name="coin" size="sm" aria-label={`${label} coin`} />
                    <span className="coin-name">{label}</span>
                    <span className="coin-abbrev">{abbrev}</span>
                  </div>

                  {/* Value input/display using EditableValue */}
                  <EditableValue
                    value={value}
                    onChange={handleCurrencyChange(key)}
                    editable={editable}
                    minValue={0}
                    maxValue={999999}
                    size="sm"
                    ariaLabel={`${label} pieces`}
                    showEditIcon={false}
                    displayValue={value.toLocaleString()}
                    displayClassName="coin-value"
                    inputClassName="coin-input"
                    displayProps={{
                      'aria-describedby': `currency-${key}-description`,
                    }}
                    debounceMs={500}
                  />

                  {/* Screen reader description */}
                  <div id={`currency-${key}-description`} className="sr-only">
                    {editable
                      ? `Current ${label} amount: ${value.toLocaleString()}. Click to edit.`
                      : `${value.toLocaleString()} ${label} pieces`}
                  </div>
                </div>

                {/* Subtle shimmer effect on hover */}
                <div className="coin-shine" />
              </Card>
            );
          })}
        </div>
      </div>
    </SectionWrapper>
  );
}
