import { type ComponentPropsWithoutRef } from 'react';
import { cn } from '@dice-jar/cn';

interface StackProps extends ComponentPropsWithoutRef<'div'> {
  direction?: 'row' | 'column';
  gap?: 1 | 2 | 3 | 4 | 6 | 8;
  align?: 'start' | 'center' | 'end' | 'stretch';
}

export const Stack = ({ direction = 'column', gap = 4, align = 'stretch', className, children, ...rest }: StackProps) => {
  const cx = cn('stack-base', `stack-${direction}`, gap !== undefined && `stack-gap-${gap}`, `stack-align-${align}`, className);

  return (
    <div className={cx} {...rest}>
      {children}
    </div>
  );
};
