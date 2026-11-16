import { cn } from '@dice-jar/cn';

interface FieldsetProps {
  legend: string;
  legendHidden?: boolean;
  children: React.ReactNode;
  className?: string;
}

// Single source of truth for how grouped controls present their label.
export const Fieldset = ({ legend, legendHidden = false, children, className }: FieldsetProps) => {
  const legendCx = legendHidden ? 'field-sr-only' : 'fieldset-legend';
  return (
    <fieldset className={cn('fieldset', className)}>
      <legend className={legendCx}>{legend}</legend>
      {children}
    </fieldset>
  );
};
