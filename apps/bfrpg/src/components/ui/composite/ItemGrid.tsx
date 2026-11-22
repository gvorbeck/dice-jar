import { Link } from 'react-router-dom';
import { Typography, Button } from '@/components/ui';
import { Icon } from '@/components/ui/core/display';
import type { IconName } from '@/components/ui/core/display';
import { SkeletonCard, LoadingState } from '@/components/ui/core/feedback';
import type { ReactNode } from 'react';
import './ItemGrid.css';

interface ItemGridProps<T> {
  items: T[];
  loading: boolean;
  error: string | null;
  emptyState: {
    icon: IconName;
    title: string;
    description: string;
    action?: {
      label: string;
      href: string;
    };
  };
  header: {
    title: string;
    icon: IconName;
    count: number;
  };
  renderItem: (item: T) => ReactNode;
  onRetry?: () => void;
}

export function ItemGrid<T extends { id: string }>({ items, loading, error, emptyState, header, renderItem, onRetry }: ItemGridProps<T>) {
  // Show loading skeleton when loading AND no items yet
  if (loading && items.length === 0) {
    return (
      <div className="item-grid">
        <div className="item-grid-head">
          <Typography variant="h4" as="h2">
            <Icon name={header.icon} size="md" />
            {header.title}
          </Typography>
          <LoadingState
            variant="inline"
            message={`Loading ${header.title.toLowerCase().replace('your ', '')}...`}
            className="item-grid-loading"
          />
        </div>

        <div className="item-grid-cells">
          {/* Show 6 skeleton cards while loading */}
          {Array.from({ length: 6 }).map((_, index) => (
            <SkeletonCard key={index} size="lg" label={`Loading ${header.title.toLowerCase().replace('your ', '')}...`} />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="item-grid-state" data-kind="error">
        <Icon name="exclamation-circle" size="xl" />
        <Typography variant="body">
          Error loading {header.title.toLowerCase()}: {String(error)}
        </Typography>
        <Button variant="secondary" size="sm" onClick={onRetry || (() => window.location.reload())}>
          Try Again
        </Button>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="item-grid-state" data-kind="empty">
        <div className="item-grid-badge">
          <Icon name={emptyState.icon} size="xl" />
        </div>
        <div className="item-grid-copy">
          <Typography variant="h4" as="h2" color="primary">
            {emptyState.title}
          </Typography>
          <Typography variant="body" color="secondary">
            {emptyState.description}
          </Typography>
        </div>
        {emptyState.action && (
          <Link to={emptyState.action.href}>
            <Button variant="primary" size="lg" icon="plus" iconSize="sm">
              {emptyState.action.label}
            </Button>
          </Link>
        )}
      </div>
    );
  }

  return (
    <div className="item-grid">
      <div className="item-grid-head">
        <Typography variant="h4" as="h2">
          <Icon name={header.icon} size="md" />
          {header.title}
        </Typography>
        <Typography variant="helper" color="secondary">
          {(() => {
            const title = header.title.toLowerCase();
            if (title.startsWith('your ')) {
              const baseTitle = title.replace('your ', '');
              const singularTitle = header.count === 1 ? baseTitle.replace(/s$/, '') : baseTitle;
              return `${header.count} ${singularTitle}`;
            }
            return `${header.count} ${header.count === 1 ? title.replace(/s$/, '') : title}`;
          })()}
        </Typography>
      </div>

      <div className="item-grid-cells">
        {items.map((item) => (
          <div key={item.id}>{renderItem(item)}</div>
        ))}
      </div>
    </div>
  );
}
