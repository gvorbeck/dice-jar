import { useId, type InputHTMLAttributes } from 'react';
import { cn } from '@dice-jar/cn';

interface ToggleWithLabel extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: React.ReactNode;
  'aria-label'?: string;
}

interface ToggleWithAriaLabel extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: never;
  'aria-label': string;
}

type ToggleProps = ToggleWithLabel | ToggleWithAriaLabel;

export const Toggle = ({ label, className, ...props }: ToggleProps) => {
  const id = useId();
  const cx = cn('toggle-label', className);

  return (
    <label htmlFor={id} className={cx}>
      <input id={id} type="checkbox" role="switch" className="toggle-input field-sr-only" {...props} />
      <span className="toggle-track">
        <span className="toggle-thumb" />
      </span>
      {label}
    </label>
  );
};
