import { forwardRef } from 'react';
import type { HTMLAttributes } from 'react';
import { cn } from '@dice-jar/cn';
import './Skeleton.css';

type SkeletonVariant = 'text' | 'card' | 'circle' | 'stat' | 'table-row';
type SkeletonSize = 'sm' | 'md' | 'lg' | 'xl';

interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  variant?: SkeletonVariant;
  size?: SkeletonSize;
  /** Percent of the container, replacing the size's width */
  width?: '40%' | '60%';
  /** Accessible label for screen readers */
  label?: string;
}

const Skeleton = forwardRef<HTMLDivElement, SkeletonProps>(
  ({ variant = 'text', size = 'md', width, label = 'Loading...', className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('skeleton', className)}
      data-variant={variant}
      data-size={size}
      data-width={width?.slice(0, 2)}
      role="status"
      aria-label={label}
      aria-hidden="true"
      {...props}
    />
  ),
);

Skeleton.displayName = 'Skeleton';

const SkeletonText = forwardRef<HTMLDivElement, Omit<SkeletonProps, 'variant'>>((props, ref) => (
  <Skeleton ref={ref} variant="text" {...props} />
));
SkeletonText.displayName = 'SkeletonText';

export const SkeletonCard = forwardRef<HTMLDivElement, Omit<SkeletonProps, 'variant'>>((props, ref) => (
  <Skeleton ref={ref} variant="card" {...props} />
));
SkeletonCard.displayName = 'SkeletonCard';

const SkeletonCircle = forwardRef<HTMLDivElement, Omit<SkeletonProps, 'variant'>>((props, ref) => (
  <Skeleton ref={ref} variant="circle" {...props} />
));
SkeletonCircle.displayName = 'SkeletonCircle';

const SkeletonStat = forwardRef<HTMLDivElement, Omit<SkeletonProps, 'variant'>>((props, ref) => (
  <Skeleton ref={ref} variant="stat" {...props} />
));
SkeletonStat.displayName = 'SkeletonStat';

export const SkeletonTableRow = forwardRef<HTMLDivElement, Omit<SkeletonProps, 'variant'>>((props, ref) => (
  <Skeleton ref={ref} variant="table-row" {...props} />
));
SkeletonTableRow.displayName = 'SkeletonTableRow';

interface SkeletonStatBlockProps extends HTMLAttributes<HTMLDivElement> {
  stats?: number;
  showTitle?: boolean;
  label?: string;
}

export const SkeletonStatBlock = forwardRef<HTMLDivElement, SkeletonStatBlockProps>(
  ({ stats = 6, showTitle = true, label = 'Loading character stats...', className, ...props }, ref) => (
    <div ref={ref} className={cn('skeleton-stats', className)} role="status" aria-label={label} {...props}>
      {showTitle && <SkeletonText size="lg" width="60%" />}
      <div className="skeleton-stats-grid">
        {Array.from({ length: stats }).map((_, index) => (
          <SkeletonStat key={index} size="md" />
        ))}
      </div>
    </div>
  ),
);
SkeletonStatBlock.displayName = 'SkeletonStatBlock';

interface SkeletonListProps extends HTMLAttributes<HTMLDivElement> {
  items?: number;
  showAvatar?: boolean;
  label?: string;
}

export const SkeletonList = forwardRef<HTMLDivElement, SkeletonListProps>(
  ({ items = 3, showAvatar = false, label = 'Loading list...', className, ...props }, ref) => (
    <div ref={ref} className={cn('skeleton-list', className)} role="status" aria-label={label} {...props}>
      {Array.from({ length: items }).map((_, index) => (
        <div key={index} className="skeleton-row">
          {showAvatar && <SkeletonCircle size="md" />}
          <div className="skeleton-lines">
            <SkeletonText size="md" width="40%" />
            <SkeletonText size="sm" width="60%" />
          </div>
        </div>
      ))}
    </div>
  ),
);
SkeletonList.displayName = 'SkeletonList';
