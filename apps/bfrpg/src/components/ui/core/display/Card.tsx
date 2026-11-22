import { forwardRef } from 'react';
import type { ReactNode, HTMLAttributes } from 'react';
import { cn } from '@dice-jar/cn';
import './Card.css';

type CardVariant = 'info' | 'success' | 'standard' | 'nested' | 'gradient' | 'hero';
type CardSize = 'compact' | 'default';
type CardShadow = 'soft' | 'standard' | 'elevated';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  variant?: CardVariant;
  size?: CardSize;
  shadow?: CardShadow;
  hover?: boolean;
}

const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ children, variant = 'standard', size = 'default', shadow = 'standard', hover = false, className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('card', className)}
      data-variant={variant}
      data-size={size}
      data-shadow={shadow}
      {...(hover && { 'data-hover': true })}
      {...props}
    >
      {children}
    </div>
  ),
);

Card.displayName = 'Card';

export default Card;
