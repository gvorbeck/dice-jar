import { cn } from '@dice-jar/cn';
import { Icon } from '@/components/ui/core/display';
import type { IconName } from '@/components/ui/core/display';
import './FeatureCard.css';

interface FeatureCardProps {
  icon: IconName;
  title: string;
  description: string;
  className?: string;
}

export function FeatureCard({ icon, title, description, className }: FeatureCardProps) {
  return (
    <div className={cn('feature-card', className)}>
      <Icon name={icon} size="lg" />
      <div>
        <h4>{title}</h4>
        <p>{description}</p>
      </div>
    </div>
  );
}
