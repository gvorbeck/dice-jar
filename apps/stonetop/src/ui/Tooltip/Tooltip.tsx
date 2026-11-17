import { cn } from '@dice-jar/cn';
import { Focusable, OverlayArrow, Tooltip as AriaTooltip, TooltipTrigger } from 'react-aria-components';

interface TooltipProps {
  text: string;
  side?: 'top' | 'bottom' | 'left' | 'right';
  /** Wrap non-interactive content (an icon) in a focusable image named by the tooltip; otherwise the child itself must be focusable and pass its ref and props on. */
  plain?: boolean;
  /** With `plain`: keep the wrapper out of the tab order. */
  noTabStop?: boolean;
  className?: string;
  children: React.ReactElement;
}

// React Aria shows it on hover and keyboard focus, flips it at the screen edge, and keeps it inside the viewport.
export const Tooltip = ({ text, side = 'top', plain = false, noTabStop = false, className, children }: TooltipProps) => (
  <TooltipTrigger delay={0} closeDelay={100}>
    <Focusable excludeFromTabOrder={plain && noTabStop}>
      {plain ? (
        <span role="img" aria-label={text} className={cn('tooltip-wrapper field-focus-visible', className)}>
          {children}
        </span>
      ) : (
        children
      )}
    </Focusable>
    <AriaTooltip placement={side} offset={8} className="tooltip">
      <OverlayArrow className="tooltip-arrow">
        <svg width="8" height="8" viewBox="0 0 8 8" aria-hidden="true">
          <path d="M0 0 L4 4 L8 0" />
        </svg>
      </OverlayArrow>
      {text}
    </AriaTooltip>
  </TooltipTrigger>
);
