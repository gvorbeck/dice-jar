import { forwardRef } from 'react';
import type { ReactNode } from 'react';
import { Typography } from '@/components/ui/core/display';
import { cn } from '@dice-jar/cn';
import './Details.css';

export interface DescriptionItem {
  label: ReactNode;
  children: ReactNode;
  span?: 1 | 2 | 3;
}

interface DetailsProps {
  items: DescriptionItem[];
  size?: 'sm' | 'md' | 'lg';
  layout?: 'horizontal' | 'vertical' | 'cards';
  className?: string;
}

const Details = forwardRef<HTMLDivElement, DetailsProps>(({ items, size = 'md', layout = 'vertical', className }, ref) => (
  <div ref={ref} className={cn('details', className)} data-size={size} data-layout={layout}>
    {items.map((item, index) => {
      if (layout === 'horizontal') {
        return (
          <div key={index} className="details-tile">
            <div className="details-accent" />
            <div>
              <div className="details-label">{item.label}</div>
              <div className="details-content">{item.children}</div>
            </div>
          </div>
        );
      }

      if (layout === 'cards') {
        return (
          <div key={index} className="details-card">
            <div className="details-card-head">
              <div className="details-card-dot" />
              <Typography variant="bodySmall" color="amber" weight="semibold" className="details-card-title">
                {item.label}
              </Typography>
            </div>
            <div className="details-content">{item.children}</div>
          </div>
        );
      }

      return (
        <div key={index} className="details-row">
          <div className="details-row-lead">
            <div className="details-row-dot" />
            <span className="details-label">{item.label}</span>
          </div>
          <div className="details-content">{item.children}</div>
        </div>
      );
    })}
  </div>
));

Details.displayName = 'Details';

export default Details;
