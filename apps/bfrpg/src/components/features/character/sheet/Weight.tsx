import { SectionWrapper } from '@/components/ui/core/layout';
import { StatusIndicator } from '@/components/ui/composite';
import { calculateTotalCoinCount, calculateCoinWeight } from '@/utils/currency';
import type { Character } from '@/types';
import type { StatusThreshold } from '@/components/ui/composite/StatusIndicator';
import './Weight.css';

interface WeightProps {
  character: Character;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

// Carrying capacity tables based on strength and race
const CARRYING_CAPACITY = {
  // Dwarf, Elf, Human - corrected from BFRPG table
  normal: {
    3: { light: 25, heavy: 60 },
    4: { light: 35, heavy: 90 },
    5: { light: 35, heavy: 90 },
    6: { light: 50, heavy: 120 },
    7: { light: 50, heavy: 120 },
    8: { light: 50, heavy: 120 },
    9: { light: 60, heavy: 150 },
    10: { light: 60, heavy: 150 },
    11: { light: 60, heavy: 150 },
    12: { light: 60, heavy: 150 },
    13: { light: 65, heavy: 165 },
    14: { light: 65, heavy: 165 },
    15: { light: 65, heavy: 165 },
    16: { light: 70, heavy: 180 },
    17: { light: 70, heavy: 180 },
    18: { light: 80, heavy: 195 },
  },
  // Halfling
  halfling: {
    3: { light: 20, heavy: 40 },
    4: { light: 30, heavy: 60 },
    5: { light: 30, heavy: 60 },
    6: { light: 40, heavy: 80 },
    7: { light: 40, heavy: 80 },
    8: { light: 40, heavy: 80 },
    9: { light: 50, heavy: 100 },
    10: { light: 50, heavy: 100 },
    11: { light: 50, heavy: 100 },
    12: { light: 50, heavy: 100 },
    13: { light: 55, heavy: 110 },
    14: { light: 55, heavy: 110 },
    15: { light: 55, heavy: 110 },
    16: { light: 60, heavy: 120 },
    17: { light: 60, heavy: 120 },
    18: { light: 65, heavy: 130 },
  },
};

function getCarryingCapacity(race: string, strengthScore: number) {
  const isHalfling = race.toLowerCase() === 'halfling';
  const table = isHalfling ? CARRYING_CAPACITY.halfling : CARRYING_CAPACITY.normal;

  // Clamp strength score to table bounds
  const clampedStr = Math.max(3, Math.min(18, strengthScore));
  return table[clampedStr as keyof typeof table];
}

function calculateTotalWeight(character: Character): number {
  // Calculate equipment weight (excluding beasts of burden which don't count as carried weight)
  const equipmentWeight = character.equipment.reduce((total, item) => {
    if (item.category === 'beasts-of-burden') {
      return total; // Beasts of burden don't add to carried weight
    }
    return total + item.weight * item.amount;
  }, 0);

  // Calculate coin weight if enabled (defaults to true)
  let coinWeight = 0;
  const shouldUseCoinWeight = character.settings?.useCoinWeight !== false;
  if (shouldUseCoinWeight) {
    const totalCoins = calculateTotalCoinCount(character.currency);
    coinWeight = calculateCoinWeight(totalCoins);
  }

  return equipmentWeight + coinWeight;
}

function calculateBeastCapacity(character: Character): {
  lightCapacity: number;
  heavyCapacity: number;
} {
  return character.equipment.reduce(
    (total, item) => {
      if (item.category === 'beasts-of-burden' && item.amount > 0) {
        const lightCap = (item.lowCapacity || 0) * item.amount;
        const heavyCap = (item.capacity || 0) * item.amount;

        return {
          lightCapacity: total.lightCapacity + lightCap,
          heavyCapacity: total.heavyCapacity + heavyCap,
        };
      }
      return total;
    },
    { lightCapacity: 0, heavyCapacity: 0 },
  );
}

function createWeightThresholds(lightCapacity: number, heavyCapacity: number): StatusThreshold[] {
  const lightPercentage = (lightCapacity / heavyCapacity) * 100;

  return [
    {
      min: 100.1,
      max: Infinity,
      tone: 'red',
      label: 'Overloaded',
    },
    {
      min: lightPercentage,
      max: 100.1,
      tone: 'yellow',
      label: 'Heavily Loaded',
    },
    {
      min: 0,
      max: lightPercentage,
      tone: 'lime',
      label: 'Lightly Loaded',
    },
  ];
}

export default function Weight({ character, className = '', size = 'md' }: WeightProps) {
  const totalWeight = calculateTotalWeight(character);
  const pcCapacity = getCarryingCapacity(character.race, character.abilities.strength.value);
  const beastCapacity = calculateBeastCapacity(character);

  // Combined capacity (PC + beasts of burden)
  const totalCapacity = {
    light: pcCapacity.light + beastCapacity.lightCapacity,
    heavy: pcCapacity.heavy + beastCapacity.heavyCapacity,
  };

  const weightThresholds = createWeightThresholds(totalCapacity.light, totalCapacity.heavy);

  // Calculate breakdown for display
  const equipmentWeight = character.equipment.reduce((total, item) => {
    if (item.category === 'beasts-of-burden') {
      return total; // Don't count beasts in equipment weight
    }
    return total + item.weight * item.amount;
  }, 0);
  const coinWeight = character.settings?.useCoinWeight !== false ? calculateCoinWeight(calculateTotalCoinCount(character.currency)) : 0;

  // Check if character has any beasts of burden
  const hasBeasts = character.equipment.some((item) => item.category === 'beasts-of-burden' && item.amount > 0);

  return (
    <SectionWrapper title="Weight" size={size} className={className}>
      <div className="sheet-pad" data-size={size}>
        <div className="weight">
          {/* Current Weight vs Capacity */}
          <div className="weight-now">
            <div
              className="weight-line"
              role="group"
              aria-label={`Current weight: ${totalWeight.toFixed(1)} pounds out of ${totalCapacity.heavy} pound maximum capacity`}
            >
              <span className="weight-carried">{totalWeight.toFixed(1)}</span>
              <span className="weight-sep" aria-hidden="true">
                /
              </span>
              <span className="weight-max">{totalCapacity.heavy}</span>
              <span className="weight-unit">lbs</span>
            </div>

            {/* Load Status with StatusIndicator */}
            <StatusIndicator
              current={totalWeight}
              max={totalCapacity.heavy}
              thresholds={weightThresholds}
              showBar={true}
              showLabel={true}
            />
          </div>

          {/* Weight Breakdown */}
          <div className="weight-rows">
            <div className="weight-row">
              <span>Equipment:</span>
              <span>{equipmentWeight.toFixed(1)} lbs</span>
            </div>

            {character.settings?.useCoinWeight !== false && (
              <div className="weight-row">
                <span>Coins:</span>
                <span>{coinWeight.toFixed(1)} lbs</span>
              </div>
            )}

            <hr />

            <div className="weight-row" data-strong>
              <span>Total:</span>
              <span>{totalWeight.toFixed(1)} lbs</span>
            </div>
          </div>

          {/* Capacity Indicators */}
          <div className="weight-rows" data-tight>
            {hasBeasts ? (
              <>
                {/* PC Capacity */}
                <div className="weight-row">
                  <span>PC Light Load:</span>
                  <span>{pcCapacity.light} lbs</span>
                </div>
                <div className="weight-row">
                  <span>PC Heavy Load:</span>
                  <span>{pcCapacity.heavy} lbs</span>
                </div>

                {/* Beast Capacity */}
                <div className="weight-row">
                  <span>Animal Light Load:</span>
                  <span>{beastCapacity.lightCapacity} lbs</span>
                </div>
                <div className="weight-row">
                  <span>Animal Heavy Load:</span>
                  <span>{beastCapacity.heavyCapacity} lbs</span>
                </div>

                <hr />

                {/* Total Capacity */}
                <div className="weight-row" data-strong>
                  <span>Total Light Load:</span>
                  <span>{totalCapacity.light} lbs</span>
                </div>
                <div className="weight-row" data-strong>
                  <span>Total Heavy Load:</span>
                  <span>{totalCapacity.heavy} lbs</span>
                </div>
              </>
            ) : (
              <>
                <div className="weight-row">
                  <span>Light Load Max:</span>
                  <span>{pcCapacity.light} lbs</span>
                </div>
                <div className="weight-row">
                  <span>Heavy Load Max:</span>
                  <span>{pcCapacity.heavy} lbs</span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </SectionWrapper>
  );
}
