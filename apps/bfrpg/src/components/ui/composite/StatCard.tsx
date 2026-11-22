import { forwardRef } from 'react';
import { cn } from '@dice-jar/cn';
import { Typography } from '@/components/ui/core/display';
import './StatCard.css';

interface StatCardProps {
  /** The main label/title for the stat */
  label: string;
  /** Full name for accessibility and tooltips */
  fullName?: string;
  /** The value to display */
  value: string | number;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const StatCard = forwardRef<HTMLDivElement, StatCardProps>(({ label, fullName, value, size = 'md', className }, ref) => (
  <div ref={ref} className={cn('stat-card', className)} data-size={size} title={fullName || label}>
    <div className="stat-card-body">
      <Typography variant="bodySmall" color="amber" weight="medium" as="h4" className="stat-card-label">
        {label}
      </Typography>
      <div className="stat-card-value">{value}</div>
    </div>
  </div>
));

StatCard.displayName = 'StatCard';

export default StatCard;
