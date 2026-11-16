import { useMemo } from 'react';
import { cn } from '@dice-jar/cn';
import { Checkbox } from '../Checkbox/Checkbox';
import { Fieldset } from '../Fieldset/Fieldset';
import { Text } from '../Text/Text';
import type { CheckboxGroupItem } from '@/types';

interface CheckboxGroupProps {
  items: CheckboxGroupItem[] | string[];
  checked: Record<string, boolean>;
  onChange: (id: string, checked: boolean) => void;
  label?: string;
  pickNote?: string;
  max?: number;
  disabled?: boolean;
  columns?: 1 | 2 | 4 | 6 | 'responsive-2-4-6';
  itemGap?: 'sm' | 'md' | 'lg';
}

const normalizeItems = (items: CheckboxGroupItem[] | string[]): CheckboxGroupItem[] =>
  items.map((item) => (typeof item === 'string' ? { id: item, label: item } : item));

export const CheckboxGroup = ({
  items: rawItems,
  checked,
  onChange,
  label,
  pickNote,
  max,
  disabled = false,
  columns = 1,
  itemGap,
}: CheckboxGroupProps) => {
  const items = useMemo(() => normalizeItems(rawItems), [rawItems]);
  const selectedCount = items.filter(({ id }) => checked[id]).length;
  const atMax = max !== undefined && selectedCount >= max;

  const gridClass = cn(
    columns === 'responsive-2-4-6'
      ? 'checkbox-group-grid-responsive246'
      : columns === 6
        ? 'checkbox-group-grid6'
        : columns === 4
          ? 'checkbox-group-grid4'
          : columns === 2
            ? 'checkbox-group-grid2'
            : 'checkbox-group-list',
    itemGap === 'md' && 'checkbox-group-gap-md',
    itemGap === 'lg' && 'checkbox-group-gap-lg',
  );

  return (
    <Fieldset legend={label ?? 'Options'} legendHidden={!label} className="checkbox-group">
      {pickNote && (
        <Text size="xs" color="tertiary" italic>
          {pickNote}
        </Text>
      )}
      <div className={gridClass}>
        {items.map(({ id, label: itemLabel, disabled: itemDisabled }) => {
          const isChecked = checked[id] ?? false;
          const isDisabled = disabled || itemDisabled || (!isChecked && atMax);
          return (
            <Checkbox
              key={id}
              checked={isChecked}
              disabled={isDisabled}
              onChange={(e) => onChange(id, e.target.checked)}
              label={itemLabel}
            />
          );
        })}
      </div>
    </Fieldset>
  );
};
