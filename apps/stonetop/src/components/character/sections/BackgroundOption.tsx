import { memo, useCallback, useMemo } from 'react';
import { Radio, CheckboxGroup, Input, UseDots } from '@/components/ui';
import type { CheckboxGroupItem } from '@/components/ui';
import { parseMarkdown } from '@/lib/parseMarkdown';
import type { BackgroundOption, ChoiceConfig } from '@/types';

const resolveMax = (choices: ChoiceConfig, level: number): number => {
  if (!choices.levelGatedMax) return choices.max;
  let max = 0;
  for (const [minLevel, gatedMax] of choices.levelGatedMax) {
    if (level >= minLevel) max = gatedMax;
  }
  return max;
};

interface BoundedCheckboxListProps {
  choices: ChoiceConfig;
  level: number;
  disabled: boolean;
  selected: string[];
  onSave: (choices: string[]) => void;
}

const BoundedCheckboxList = ({ choices, level, disabled, selected, onSave }: BoundedCheckboxListProps) => {
  const lockedValues = choices.items.filter((c) => c.locked).map((c) => c.value);
  const effectiveMax = resolveMax(choices, level);

  const items = useMemo<CheckboxGroupItem[]>(
    () =>
      choices.items.map((c) => ({
        id: c.value,
        label: c.label,
        disabled: disabled || c.locked,
      })),
    [choices.items, disabled],
  );

  const checked = useMemo<Record<string, boolean>>(
    () => Object.fromEntries(choices.items.map((c) => [c.value, c.locked || selected.includes(c.value)])),
    [choices.items, selected],
  );

  const handleChange = useCallback(
    (value: string, isChecked: boolean) => {
      if (choices.items.find((c) => c.value === value)?.locked) return;
      const next = isChecked ? [...selected, value] : selected.filter((v) => v !== value);
      onSave(next);
    },
    [choices.items, selected, onSave],
  );

  return (
    <div className="background-choices">
      <CheckboxGroup items={items} checked={checked} onChange={handleChange} max={effectiveMax + lockedValues.length} disabled={disabled} />
    </div>
  );
};

interface BackgroundOptionItemProps {
  option: BackgroundOption;
  groupName: string;
  level: number;
  selected: boolean;
  selectedChoices: string[];
  usesChecked: number;
  freeTextValue: string;
  onSelect: (value: string) => void;
  onChoicesChange: (choices: string[]) => void;
  onUsesChange: (value: string, count: number) => void;
  onFreeTextChange: (key: string, value: string) => void;
}

export const BackgroundOptionItem = memo(
  ({
    option,
    groupName,
    level,
    selected,
    selectedChoices,
    usesChecked,
    freeTextValue,
    onSelect,
    onChoicesChange,
    onUsesChange,
    onFreeTextChange,
  }: BackgroundOptionItemProps) => (
    <div className="background-option">
      <Radio
        name={groupName}
        value={option.value}
        checked={selected}
        onChange={() => onSelect(option.value)}
        label={
          <span className="background-option-title-row">
            <span className="background-option-title">{option.title}</span>
            {option.uses !== undefined && (
              <span className="background-option-title-row-uses">
                <UseDots
                  total={option.uses}
                  checked={usesChecked}
                  onChange={(n) => onUsesChange(option.value, n)}
                  disabled={!selected}
                  ariaLabel={option.title}
                />
              </span>
            )}
          </span>
        }
      />
      <div className="background-option-body">
        <div className="background-option-content">{parseMarkdown(option.content)}</div>
        {option.choices && (
          <BoundedCheckboxList
            choices={option.choices}
            level={level}
            disabled={!selected}
            selected={selected ? selectedChoices : []}
            onSave={onChoicesChange}
          />
        )}
        {option.postContent && <div className="background-option-content">{parseMarkdown(option.postContent)}</div>}
        {option.freeText && (
          <Input
            multiline
            id={`${groupName}-freetext-${option.value}`}
            label={option.freeText.label}
            value={freeTextValue}
            disabled={!selected}
            onChange={(e) => onFreeTextChange(option.freeText!.key, e.target.value)}
          />
        )}
      </div>
    </div>
  ),
);
