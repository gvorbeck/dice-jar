import type { ReactNode } from 'react';
import { Card, Typography } from '@/components/ui/core/display';
import './DetailSection.css';

interface DetailSectionProps {
  icon: ReactNode;
  title: string;
  children: ReactNode;
  variant?: 'nested' | 'standard';
  className?: string;
}

export default function DetailSection({ icon, title, children, variant = 'nested', className }: DetailSectionProps) {
  return (
    <Card variant={variant} className={className}>
      <Typography variant="subHeadingSpaced">
        <div className="detail-icon">{icon}</div>
        {title}
      </Typography>
      {children}
    </Card>
  );
}
