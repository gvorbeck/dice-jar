import { forwardRef, useState, useEffect, useCallback } from 'react';
import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '@dice-jar/cn';
import { TooltipWrapper } from '@/components';
import { useFocusManagement } from '@/hooks';
import './FloatingActionButton.css';

interface FloatingActionButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Icon or content for the button */
  children: ReactNode;
  variant?: 'primary' | 'secondary';
  size?: 'md' | 'lg';
  /** Tooltip text that appears on hover */
  tooltip?: string;
  showTooltip?: boolean;
}

const FloatingActionButton = forwardRef<HTMLButtonElement, FloatingActionButtonProps>(
  (
    { children, variant = 'primary', size = 'md', tooltip, showTooltip = true, disabled, className, 'aria-label': ariaLabel, ...props },
    ref,
  ) => (
    <TooltipWrapper tooltip={tooltip} showTooltip={showTooltip} disabled={!!disabled}>
      <button
        ref={ref}
        disabled={disabled}
        aria-label={ariaLabel || tooltip}
        className={cn('fab', className)}
        data-variant={variant}
        data-size={size}
        {...props}
      >
        {children}
      </button>
    </TooltipWrapper>
  ),
);

FloatingActionButton.displayName = 'FloatingActionButton';

interface FABGroupProps {
  /** Secondary actions, shown when the group is expanded */
  actions: Array<Omit<FloatingActionButtonProps, 'className'> & { key: string; label: string }>;
  /** The button that opens and closes the group */
  mainAction: Omit<FloatingActionButtonProps, 'className'> & { key: string; label: string };
}

const FABGroup = ({ actions, mainAction }: FABGroupProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const { containerRef, focusFirstElement } = useFocusManagement({ trapFocus: true, restoreFocus: true, isActive: isExpanded });

  const handleToggle = useCallback(() => {
    const next = !isExpanded;
    setIsExpanded(next);
    // Small delay to allow DOM updates
    if (next) setTimeout(focusFirstElement, 100);
  }, [isExpanded, focusFirstElement]);

  useEffect(() => {
    if (!isExpanded) return undefined;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsExpanded(false);
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isExpanded]);

  const { key, label, ...mainProps } = mainAction;

  return (
    <div ref={containerRef} className="fab-group" role="group" aria-label="Floating action menu">
      {isExpanded && (
        <div className="fab-actions">
          {actions.map(({ key: actionKey, label: actionLabel, ...actionProps }) => (
            <div key={actionKey} className="fab-action">
              <span className="fab-label">{actionLabel}</span>
              <FloatingActionButton
                {...actionProps}
                aria-label={actionProps['aria-label'] || actionLabel}
                tooltip={actionProps.tooltip || actionLabel}
                showTooltip={false}
              />
            </div>
          ))}
        </div>
      )}

      <FloatingActionButton
        key={key}
        {...mainProps}
        onClick={(e) => {
          handleToggle();
          mainProps.onClick?.(e);
        }}
        aria-label={mainProps['aria-label'] || label}
        aria-expanded={isExpanded}
        aria-haspopup="true"
        className="fab-main"
      />

      {isExpanded && <div className="fab-backdrop" onClick={handleToggle} aria-hidden="true" />}
    </div>
  );
};

export { FloatingActionButton, FABGroup };
