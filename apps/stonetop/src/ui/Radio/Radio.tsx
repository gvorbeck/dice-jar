import { useId, type InputHTMLAttributes } from 'react';
import { cn } from '@dice-jar/cn';
import { Text } from '../Text/Text';

interface RadioProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: React.ReactNode;
}

export const Radio = ({ label, className, ...props }: RadioProps) => {
  const id = useId();
  const cx = cn('radio-label', className);

  return (
    <label htmlFor={id} className={cx}>
      <input id={id} type="radio" className="radio-input field-sr-only" {...props} />
      <span className="radio-indicator">
        <span className="radio-dot" />
      </span>
      {typeof label === 'string' ? <Text as="span">{label}</Text> : label}
    </label>
  );
};
