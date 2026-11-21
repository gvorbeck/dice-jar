import type { ReactNode } from 'react';
import { cn } from '@dice-jar/cn';
import { Badge, Typography } from '@/components/ui/core/display';
import './InfoCardHeader.css';

interface InfoCardHeaderProps {
  icon: ReactNode;
  title: string;
  badge?: {
    text: string;
    variant?: 'supplemental' | 'status' | 'warning';
  };
  iconSize?: 'sm' | 'md' | 'lg';
  /** Space below the header: snug (0.75rem), normal (1rem) or roomy (1.5rem) */
  spacing?: 'snug' | 'normal' | 'roomy';
  className?: string;
}

export default function InfoCardHeader({ icon, title, badge, iconSize = 'md', spacing = 'snug', className }: InfoCardHeaderProps) {
  return (
    <div className={cn('info-card-header', className)} data-spacing={spacing}>
      <div className="info-card-icon" data-size={iconSize}>
        {icon}
      </div>
      <Typography variant="h5" weight="semibold" className="info-card-title">
        {title}
      </Typography>
      {badge && <Badge variant={badge.variant || 'supplemental'}>{badge.text}</Badge>}
    </div>
  );
}
