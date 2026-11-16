import { useCallback } from 'react';
import { Input, Text } from '@/components/ui';
import type { INSERT_PURPOSE_OPTIONS as PurposeOptions } from '@/lib/insertSharedData';

interface PurposeDetailProps {
  opt: (typeof PurposeOptions)[number];
  nameValue: string;
  onNameChange: (purposeValue: string, e: React.ChangeEvent<HTMLInputElement>) => void;
  onNameBlur: () => void;
}

export const PurposeDetail = ({ opt, nameValue, onNameChange, onNameBlur }: PurposeDetailProps) => {
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => onNameChange(opt.value, e), [onNameChange, opt.value]);

  return (
    <div className="insert-sections-purpose-detail">
      <Input
        className="insert-sections-purpose-name-input"
        type="text"
        value={nameValue}
        placeholder={opt.namePlaceholder}
        aria-label={opt.namePrompt}
        onChange={handleChange}
        onBlur={onNameBlur}
      />
      <ul className="insert-sections-trigger-list">
        {opt.triggers.map((t) => (
          <li key={t} className="insert-sections-trigger-item">
            <Text as="span" font="serif" color="muted">
              {t}
            </Text>
          </li>
        ))}
      </ul>
    </div>
  );
};
