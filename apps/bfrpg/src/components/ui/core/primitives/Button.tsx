import { forwardRef, type ReactNode } from 'react';
import { Button as AriaButton } from 'react-aria-components';
import { cn } from '@dice-jar/cn';
import type { BaseButtonProps } from '@/types';
import { Icon, type IconName } from '@/components/ui/core/display/Icon';
import './Button.css';

export interface ButtonProps extends Omit<BaseButtonProps, 'onClick'> {
  // Fired through RAC's onPress, which also stops the press reaching parents; the click event is not exposed
  onClick?: () => void;
  children?: ReactNode;
  icon?: IconName;
  iconSize?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  iconClassName?: string;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      icon,
      iconSize = 'sm',
      iconClassName,
      loading = false,
      loadingText = 'Loading...',
      disabled,
      type = 'button',
      variant = 'primary',
      size = 'md',
      className = '',
      'aria-label': ariaLabel,
      onClick,
      title,
      ...props
    },
    ref,
  ) => {
    return (
      <AriaButton
        ref={ref}
        type={type}
        isDisabled={disabled ?? false}
        isPending={loading}
        aria-label={ariaLabel}
        onPress={onClick}
        className={cn('btn', `btn-${variant}`, `btn-${size}`, className)}
        // RAC filters title out of the DOM props, so render it back on
        render={(domProps) => <button {...domProps} title={title} />}
        {...(props as object)}
      >
        {loading && <span aria-hidden="true" className="btn-spinner" />}
        <span className="btn-label" data-loading={loading || undefined}>
          {icon && <Icon name={icon} size={iconSize} className={iconClassName || ''} />}
          {children}
        </span>
        {loading && <span className="sr-only">{loadingText}</span>}
      </AriaButton>
    );
  },
);

Button.displayName = 'Button';

export default Button;
