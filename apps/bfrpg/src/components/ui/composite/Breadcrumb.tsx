import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Icon } from '@/components/ui';
import List, { ListItem } from './List';
import { cn } from '@dice-jar/cn';
import './Breadcrumb.css';

interface BreadcrumbItem {
  label: string;
  href?: string;
  current?: boolean;
  icon?: ReactNode;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  separator?: ReactNode;
  className?: string;
}

function Breadcrumb({ items, separator, className }: BreadcrumbProps) {
  // Default separator with proper spacing and styling
  const defaultSeparator = <Icon name="chevron-right" size="sm" aria-hidden={true} />;

  const sep = separator || defaultSeparator;

  return (
    <nav role="navigation" aria-label="Breadcrumb" className={cn('crumbs', className)}>
      <List variant="breadcrumb" role="list">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          const isCurrent = item.current || isLast;

          return (
            <ListItem key={`${item.label}-${index}`} className="crumb">
              {/* Breadcrumb item */}
              <div className="crumb-body">
                {item.icon && (
                  <span className="crumb-icon" aria-hidden="true">
                    {item.icon}
                  </span>
                )}

                {isCurrent ? (
                  <span className="crumb-current" aria-current="page">
                    {item.label}
                  </span>
                ) : item.href ? (
                  <Link to={item.href} className="crumb-link">
                    {item.label}
                  </Link>
                ) : (
                  <span className="crumb-text">{item.label}</span>
                )}
              </div>

              {/* Separator - only show if not the last item */}
              {!isLast && (
                <span className="crumb-sep" aria-hidden="true">
                  {sep}
                </span>
              )}
            </ListItem>
          );
        })}
      </List>
    </nav>
  );
}

export default Breadcrumb;
