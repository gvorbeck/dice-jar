import { memo } from 'react';
import { StatCard } from '@/components/ui/composite';
import { displayValue } from '@/utils';
import type { Monster, MonsterStats } from '@/types';
import './MonsterStatsDisplay.css';

interface MonsterStatsDisplayProps {
  stats: MonsterStats | Monster;
}

export const MonsterStatsDisplay = memo(({ stats }: MonsterStatsDisplayProps) => {
  return (
    <div className="monster-stats">
      <StatCard label="AC" value={displayValue(stats.ac)} size="sm" />

      <StatCard label="HD" value={displayValue(stats.hitDice)} size="sm" />

      <StatCard label="Attacks" value={displayValue(stats.numAttacks)} size="sm" />

      <StatCard label="Damage" value={displayValue(stats.damage)} size="sm" className="monster-damage" />

      <StatCard label="Movement" value={displayValue(stats.movement)} size="sm" />

      <StatCard label="Morale" value={displayValue(stats.morale)} size="sm" />

      <StatCard label="XP" value={displayValue(stats.xp)} size="sm" />
    </div>
  );
});

MonsterStatsDisplay.displayName = 'MonsterStatsDisplay';
