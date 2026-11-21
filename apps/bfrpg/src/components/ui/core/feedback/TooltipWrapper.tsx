import React from 'react';
import type { DOMAttributes, ReactElement } from 'react';
import Tooltip from './Tooltip';

interface TooltipWrapperProps {
  /** The tooltip content to display */
  tooltip?: string | undefined;
  /** Whether to show the tooltip */
  showTooltip?: boolean;
  /** The children to wrap with tooltip functionality */
  children: ReactElement<DOMAttributes<HTMLElement>, string>;
  /** Whether the trigger element is disabled (tooltips won't show for disabled elements) */
  disabled?: boolean;
  /** Additional className for the tooltip */
  tooltipClassName?: string | undefined;
}

/** Wraps its child in a Tooltip only when there is tooltip text to show. */
const TooltipWrapper: React.FC<TooltipWrapperProps> = ({
  tooltip,
  showTooltip = true,
  children,
  disabled = false,
  tooltipClassName = '',
}) => {
  // Only show tooltip if all conditions are met
  const shouldShowTooltip = Boolean(tooltip?.trim()) && showTooltip && !disabled;

  if (shouldShowTooltip && tooltip) {
    return (
      <Tooltip content={tooltip} className={tooltipClassName} disabled={disabled}>
        {children}
      </Tooltip>
    );
  }

  // Return children unwrapped if no tooltip should be shown
  return <>{children}</>;
};

TooltipWrapper.displayName = 'TooltipWrapper';

export default TooltipWrapper;
