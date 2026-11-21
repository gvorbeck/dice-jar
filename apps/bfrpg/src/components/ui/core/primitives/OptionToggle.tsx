import { Switch } from '@/components/ui/core/primitives';
import { Typography } from '@/components/ui/core/display';
import { cn } from '@dice-jar/cn';
import './OptionToggle.css';

interface OptionToggleProps {
  title: string;
  description: string;
  switchLabel: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  className?: string;
}

export function OptionToggle({ title, description, switchLabel, checked, onCheckedChange, className }: OptionToggleProps) {
  return (
    <div className={cn('option-toggle', className)}>
      <div>
        <Typography variant="baseSectionHeading" color="zinc">
          {title}
        </Typography>
        <Typography variant="helper" color="muted">
          {description}
        </Typography>
      </div>
      <Switch label={switchLabel} checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  );
}
