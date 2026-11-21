import type { DOMAttributes, ReactElement, ReactNode } from 'react';
import { Focusable, OverlayArrow, Tooltip as AriaTooltip, TooltipTrigger } from 'react-aria-components';
import { cn } from '@dice-jar/cn';
import './Tooltip.css';

interface TooltipProps {
  content: ReactNode;
  /** One element that can take focus; the tooltip opens on hover and focus. */
  children: ReactElement<DOMAttributes<HTMLElement>, string>;
  className?: string | undefined;
  disabled?: boolean;
}

// React Aria positions the tooltip, keeps it in the viewport, links it to the trigger and closes it on Escape.
export default function Tooltip({ content, children, className, disabled = false }: TooltipProps) {
  if (disabled || !content || (typeof content === 'string' && !content.trim())) return children;

  return (
    <TooltipTrigger delay={0} closeDelay={0}>
      <Focusable>{children}</Focusable>
      <AriaTooltip placement="top" offset={8} className={cn('tooltip', className)}>
        <OverlayArrow className="tooltip-arrow">
          <svg width="8" height="8" viewBox="0 0 8 8">
            <path d="M0 0 L4 4 L8 0" />
          </svg>
        </OverlayArrow>
        {content}
      </AriaTooltip>
    </TooltipTrigger>
  );
}
