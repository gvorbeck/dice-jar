import type { ReactNode } from 'react';
import { Typography } from '@/components/ui/core/display';
import { cn } from '@dice-jar/cn';
import './TextHeader.css';

interface TextHeaderProps {
  children: ReactNode;
  as?: 'span'; // a title inside a button is not a heading
  variant?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
  size?: 'sm' | 'md' | 'lg';
  underlined?: boolean;
  className?: string;
  id?: string;
}

export const TextHeader = ({ children, as, variant = 'h4', size = 'md', underlined = true, className, id }: TextHeaderProps) => (
  <Typography
    variant={variant}
    as={as ?? variant}
    className={cn('text-header', className)}
    data-size={size}
    data-underlined={underlined || undefined}
    id={id}
  >
    {children}
  </Typography>
);

TextHeader.displayName = 'TextHeader';
