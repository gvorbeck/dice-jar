import { Tooltip } from '@/components/ui/core/feedback';
import { Icon, type IconName } from '@/components/ui/core/display/Icon';
import type { ReactNode } from 'react';
import { cn } from '@dice-jar/cn';
import './InfoTooltip.css';

interface InfoTooltipProps {
  /** The content to show in the tooltip */
  content: string | ReactNode;
  /** Additional CSS classes for the wrapper */
  className?: string;
  /** Icon name to display */
  iconName?: IconName;
  /** Icon size */
  iconSize?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  /** Additional CSS classes for the icon */
  iconClassName?: string;
  /** Whether to disable the tooltip */
  disabled?: boolean;
  /** Accessible label for screen readers */
  ariaLabel?: string;
}

/**
 * InfoTooltip component that displays an info icon with a tooltip
 * Provides better accessibility than the previous version
 * Allows customization of icon and positioning
 */
export default function InfoTooltip({
  content,
  className,
  iconName = 'info-question',
  iconSize = 'sm',
  iconClassName,
  disabled = false,
  ariaLabel = 'More information',
}: InfoTooltipProps) {
  const finalIconClassName = iconClassName || cn('info-tip-icon', className);

  return (
    <Tooltip content={content} disabled={disabled}>
      <div role="button" tabIndex={0} aria-label={ariaLabel} className="info-tip">
        <Icon
          name={iconName}
          size={iconSize}
          className={finalIconClassName}
          title={ariaLabel} // Fallback for older browsers
        />
      </div>
    </Tooltip>
  );
}
