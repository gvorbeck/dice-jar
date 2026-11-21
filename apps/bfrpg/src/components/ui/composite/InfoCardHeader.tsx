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
  className?: string;
}

export default function InfoCardHeader({ icon, title, badge, iconSize = 'md', className }: InfoCardHeaderProps) {
  return (
    <div className={cn('info-card-header', className)}>
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
