import { SectionWrapper } from '@/components/ui/core/layout';
import { StatusIndicator } from '@/components/ui/composite';
import { getCharacterLoad } from '@/utils/character';
import type { Character } from '@/types';
import type { StatusThreshold } from '@/components/ui/composite/StatusIndicator';
import './Weight.css';

interface WeightProps {
  character: Character;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
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
  const {
    weight: totalWeight,
    equipmentWeight,
    coinWeight,
    pc: pcCapacity,
    beasts: beastCapacity,
    light,
    heavy,
  } = getCharacterLoad(character);
  const totalCapacity = { light, heavy };
  const weightThresholds = createWeightThresholds(light, heavy);

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
                  <span>{beastCapacity.light} lbs</span>
                </div>
                <div className="weight-row">
                  <span>Animal Heavy Load:</span>
                  <span>{beastCapacity.heavy} lbs</span>
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
