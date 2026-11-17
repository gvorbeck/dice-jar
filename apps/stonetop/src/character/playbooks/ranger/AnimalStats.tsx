import { useCallback } from 'react';
import { Input, Text } from '@/ui';
import { PlaybookSection } from '@/playbook/PlaybookSection';
import { StatBox } from '../shared/CrewWidgets';

interface AnimalStatsProps {
  hp: string;
  armor: string;
  damage: string;
  name: string;
  damageTags: string;
  selectedTypeHp: string | undefined;
  onHpChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onHpBlur: () => void;
  onArmorChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onArmorBlur: () => void;
  onDamageChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onDamageBlur: () => void;
  onNameChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onNameBlur: () => void;
  onDamageTagsChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onDamageTagsBlur: () => void;
}

export const AnimalStats = ({
  hp,
  armor,
  damage,
  name,
  damageTags,
  selectedTypeHp,
  onHpChange,
  onHpBlur,
  onArmorChange,
  onArmorBlur,
  onDamageChange,
  onDamageBlur,
  onNameChange,
  onNameBlur,
  onDamageTagsChange,
  onDamageTagsBlur,
}: AnimalStatsProps) => {
  const handleWheel = useCallback((e: React.WheelEvent<HTMLInputElement>) => e.currentTarget.blur(), []);

  return (
    <PlaybookSection title="Stats">
      <Text size="xs" color="muted" leading="normal">
        You are accompanied by a beast, with whom you have bonded deeply and communicate without words. Treat it as a follower.
      </Text>
      <div className="ranger-animal-companion-header-row">
        <div className="ranger-animal-companion-stats-row">
          <StatBox
            ariaLabel="Animal Companion HP"
            value={hp}
            inputProps={{ min: 0 }}
            onChange={onHpChange}
            onBlur={onHpBlur}
            onWheel={handleWheel}
            label={
              <>
                HP{' '}
                <Text as="span" size="xs" color="muted" italic>
                  Max [{selectedTypeHp ?? ' '}]
                </Text>
              </>
            }
          />
          <StatBox
            ariaLabel="Animal Companion armor"
            value={armor}
            inputProps={{ min: 0 }}
            onChange={onArmorChange}
            onBlur={onArmorBlur}
            onWheel={handleWheel}
            label={
              <>
                Armor{' '}
                <Text as="span" size="xs" color="muted" italic>
                  See Type
                </Text>
              </>
            }
          />
          <StatBox
            ariaLabel="Animal Companion damage"
            value={damage}
            inputType="text"
            inputProps={{ placeholder: '—' }}
            onChange={onDamageChange}
            onBlur={onDamageBlur}
            label={
              <>
                Damage{' '}
                <Text as="span" size="xs" color="muted" italic>
                  See Type
                </Text>
              </>
            }
          />
        </div>
        <div className="ranger-animal-companion-name-block">
          <Input
            label="Name"
            className="ranger-animal-companion-name-input"
            type="text"
            value={name}
            placeholder="…"
            onChange={onNameChange}
            onBlur={onNameBlur}
          />
          <Input
            label="Damage tags"
            className="ranger-animal-companion-tags-input"
            type="text"
            value={damageTags}
            placeholder="…"
            onChange={onDamageTagsChange}
            onBlur={onDamageTagsBlur}
          />
        </div>
      </div>
    </PlaybookSection>
  );
};
