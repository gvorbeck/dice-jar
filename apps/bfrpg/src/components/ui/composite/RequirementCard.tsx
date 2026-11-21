import type { ReactNode } from 'react';
import { cn } from '@dice-jar/cn';
import { Card, Typography } from '@/components/ui/core/display';
import InfoCardHeader from './InfoCardHeader';
import './RequirementCard.css';

interface RequirementCardProps {
  title: string;
  message: string | ReactNode;
  icon: ReactNode;
  variant?: 'info' | 'success';
  className?: string;
}

export function RequirementCard({ title, message, icon, variant = 'info', className }: RequirementCardProps) {
  return (
    <Card variant={variant} className={cn('requirement-card', className)}>
      <InfoCardHeader icon={icon} title={title} iconSize="md" />
      {typeof message === 'string' ? <Typography variant="description">{message}</Typography> : message}
    </Card>
  );
}
