import { useId, type InputHTMLAttributes } from 'react';
import { cn } from '@dice-jar/cn';
import { Icon } from '../Icon/Icon';
import { Text } from '../Text/Text';

interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: React.ReactNode;
  variant?: 'default' | 'provision';
  weight?: 1 | 2;
}

export const Checkbox = ({ label, className, variant = 'default', weight = 1, ...props }: CheckboxProps) => {
  const id = useId();
  const cx = cn('checkbox-label', variant === 'provision' && 'checkbox-label-provision', className);
  const iconName = props.checked ? 'filled-provisions' : 'empty-provisions';
  const iconCx = cn('checkbox-provision-icon', props.checked && 'checkbox-provision-icon-checked');

  return (
    <label htmlFor={id} className={cx}>
      <input id={id} type="checkbox" className="checkbox-input field-sr-only" {...props} />
      {variant === 'provision' ? (
        <span className="checkbox-provision-icons">
          {Array.from({ length: weight }, (_, i) => (
            <Icon key={`provision-icon-${props.checked ? 'filled' : 'empty'}-${i}`} name={iconName} size="small" className={iconCx} />
          ))}
        </span>
      ) : (
        <span className="checkbox-indicator">
          <span className="checkbox-check" />
        </span>
      )}
      {typeof label === 'string' ? <Text as="span">{label}</Text> : label}
    </label>
  );
};
