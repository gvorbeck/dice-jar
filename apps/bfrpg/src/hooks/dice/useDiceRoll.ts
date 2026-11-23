import { useCallback } from 'react';
import { useToast } from '@dice-jar/browser';
import { roll } from '@dice-jar/dice';

// Constants for dice rolling
const CRITICAL_SUCCESS = 20;
const CRITICAL_FAILURE = 1;

/**
 * Formats a dice formula with bonus modifier
 * @param bonus - The modifier to add to the dice roll
 * @returns Formatted dice formula string (e.g., "1d20+3" or "1d20-2")
 */
const formatDiceFormula = (bonus: number): string => {
  return `1d20${bonus >= 0 ? '+' : ''}${bonus}`;
};

interface AttackRollOptions {
  type: 'attack';
  bonusType: string;
  bonus: number;
}

interface SavingThrowRollOptions {
  type: 'savingThrow';
  saveName: string;
  targetNumber: number;
  modifier?: number;
}

interface AbilityRollOptions {
  type: 'ability';
  abilityName: string;
  modifier: number;
}

interface PercentileRollOptions {
  type: 'percentile';
  skillName: string;
  targetPercentage: number;
}

type RollOptions = AttackRollOptions | SavingThrowRollOptions | AbilityRollOptions | PercentileRollOptions;

export function useDiceRoll() {
  const { addToast } = useToast();

  const rollDice = useCallback(
    (options: RollOptions) => {
      try {
        const d20 = roll('1d20');

        if (options.type === 'attack') {
          const { bonusType, bonus } = options;
          const total = d20.total + bonus;
          const formula = formatDiceFormula(bonus);

          addToast(`${bonusType} Attack: ${formula} = ${d20.total}${bonus >= 0 ? '+' : ''}${bonus} = ${total}`, 'success', true);
        } else if (options.type === 'savingThrow') {
          const { saveName, targetNumber, modifier } = options;
          const actualModifier = modifier ?? 0;
          const total = d20.total + actualModifier;
          const isSuccess = total >= targetNumber || d20.total === CRITICAL_SUCCESS;
          const isCriticalFailure = d20.total === CRITICAL_FAILURE;

          let resultMessage;
          if (actualModifier !== 0) {
            const formula = formatDiceFormula(actualModifier);
            resultMessage = `${saveName}: ${formula} = ${d20.total}${
              actualModifier >= 0 ? '+' : ''
            }${actualModifier} = ${total} vs target ${targetNumber}`;
          } else {
            resultMessage = `${saveName}: 1d20 = ${d20.total} vs target ${targetNumber}`;
          }

          if (isCriticalFailure) {
            resultMessage += ' - Critical Failure!';
            addToast(resultMessage, 'error', true);
          } else if (isSuccess) {
            resultMessage += ' - Success!';
            addToast(resultMessage, 'success', true);
          } else {
            resultMessage += ' - Failed';
            addToast(resultMessage, 'error', true);
          }
        } else if (options.type === 'ability') {
          const { abilityName, modifier } = options;
          const total = d20.total + modifier;
          const formula = formatDiceFormula(modifier);

          addToast(`${abilityName} Check: ${formula} = ${d20.total}${modifier >= 0 ? '+' : ''}${modifier} = ${total}`, 'success', true);
        } else if (options.type === 'percentile') {
          const { skillName, targetPercentage } = options;
          const percentileRoll = roll('1d100');
          const result = percentileRoll.total;

          // A percentile roll succeeds on a result equal to or less than the target (Core Rules, p. 2)
          const isSuccess = result <= targetPercentage;

          addToast(
            `${skillName}: 1d100 = ${result} vs ${targetPercentage}% - ${isSuccess ? 'Success!' : 'Failure'}`,
            isSuccess ? 'success' : 'error',
            true,
          );
        }
      } catch {
        addToast('Failed to roll dice', 'error');
      }
    },
    [addToast],
  );

  const rollAttack = useCallback(
    (bonusType: string, bonus: number) => {
      rollDice({ type: 'attack', bonusType, bonus });
    },
    [rollDice],
  );

  const rollSavingThrow = useCallback(
    (saveName: string, targetNumber: number, modifier?: number) => {
      const rollOptions: SavingThrowRollOptions = {
        type: 'savingThrow',
        saveName,
        targetNumber,
      };

      if (modifier !== undefined) {
        rollOptions.modifier = modifier;
      }

      rollDice(rollOptions);
    },
    [rollDice],
  );

  const rollAbility = useCallback(
    (abilityName: string, modifier: number) => {
      rollDice({ type: 'ability', abilityName, modifier });
    },
    [rollDice],
  );

  const rollPercentile = useCallback(
    (skillName: string, targetPercentage: number) => {
      rollDice({ type: 'percentile', skillName, targetPercentage });
    },
    [rollDice],
  );

  return {
    rollAttack,
    rollSavingThrow,
    rollAbility,
    rollPercentile,
  };
}
