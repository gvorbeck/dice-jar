import { cn } from '@dice-jar/cn';
import styles from './Fieldset.module.css';

interface FieldsetProps {
  legend: string;
  legendHidden?: boolean;
  children: React.ReactNode;
  className?: string;
}

// Single source of truth for how grouped controls present their label.
export const Fieldset = ({ legend, legendHidden = false, children, className }: FieldsetProps) => {
  const legendCx = cn(styles.legend, legendHidden && styles.legendVisuallyHidden);
  return (
    <fieldset className={cn(styles.root, className)}>
      <legend className={legendCx}>{legend}</legend>
      {children}
    </fieldset>
  );
};
