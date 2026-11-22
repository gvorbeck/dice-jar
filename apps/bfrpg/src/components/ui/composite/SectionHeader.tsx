import type { ReactNode } from 'react';
import { cn } from '@dice-jar/cn';
import StatusDot from './StatusDot';
import type { StatusDotColor } from './StatusDot';
import './SectionHeader.css';

interface SectionHeaderProps {
  title: ReactNode;
  extra?: ReactNode;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  dotColor?: StatusDotColor;
}

export default function SectionHeader({ title, extra, size = 'md', className, dotColor }: SectionHeaderProps) {
  return (
    <div className={cn('section-header', className)} data-size={size}>
      {title && (
        <div className="section-header-title">
          <StatusDot {...(dotColor && { color: dotColor })} ariaLabel="Section header indicator" />
          {title}
        </div>
      )}
      {extra && <div className="section-header-extra">{extra}</div>}
    </div>
  );
}
