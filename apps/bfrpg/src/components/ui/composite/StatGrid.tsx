import type { ReactNode } from 'react';
import { Card } from '@/components/ui/core/display';
import { cn } from '@dice-jar/cn';
import './StatGrid.css';

interface StatItem {
  label: string;
  value: string | number;
  modifier?: string | number;
  icon?: ReactNode;
}

interface StatGridProps {
  stats: StatItem[];
  variant?: 'ability' | 'equipment' | 'summary';
  className?: string;
}

export function StatGrid({ stats, variant = 'ability', className }: StatGridProps) {
  return (
    <div className={cn('stat-grid', className)} data-variant={variant}>
      {stats.map((stat, index) => {
        const content = (
          <>
            {stat.icon && variant === 'equipment' && (
              <div className="stat-head">
                {stat.icon}
                <div className="stat-label">{stat.label}</div>
              </div>
            )}
            {!stat.icon && <div className="stat-label">{variant === 'ability' ? stat.label.slice(0, 3) : stat.label}</div>}
            <div className="stat-value">
              {(typeof stat.value === 'number' && stat.value > 0) || typeof stat.value === 'string' ? stat.value : '—'}
            </div>
            {stat.modifier !== undefined && (
              <div className="stat-modifier">
                {typeof stat.modifier === 'number' && stat.modifier >= 0 ? '+' : ''}
                {stat.modifier}
              </div>
            )}
          </>
        );

        return variant === 'summary' ? (
          <div key={`${stat.label}-${index}`} className="stat">
            {content}
          </div>
        ) : (
          <Card key={`${stat.label}-${index}`} variant="success" size="compact" className="stat">
            {content}
          </Card>
        );
      })}
    </div>
  );
}
