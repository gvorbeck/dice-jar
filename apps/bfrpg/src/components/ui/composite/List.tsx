import { forwardRef } from 'react';
import type { ReactNode, HTMLAttributes, RefObject } from 'react';
import { cn } from '@dice-jar/cn';
import './List.css';

type ListVariant = 'disc' | 'grid' | 'steps' | 'breadcrumb';
type ListSize = 'sm' | 'md' | 'lg';
type ListSpacing = 'tight' | 'normal' | 'loose';

interface ListProps extends Omit<HTMLAttributes<HTMLUListElement | HTMLOListElement>, 'children'> {
  variant?: ListVariant;
  size?: ListSize;
  spacing?: ListSpacing;
  children: ReactNode;
}

interface ListItemProps extends HTMLAttributes<HTMLLIElement> {
  icon?: ReactNode;
  children: ReactNode;
}

const List = forwardRef<HTMLUListElement | HTMLOListElement, ListProps>(
  ({ variant = 'disc', size = 'md', spacing = 'normal', children, className, ...props }, ref) => {
    const commonProps = {
      className: cn('list', className),
      'data-variant': variant,
      'data-size': size,
      'data-spacing': spacing,
      role: variant === 'breadcrumb' ? 'list' : undefined,
      'aria-label': variant === 'steps' ? 'Step-by-step instructions' : undefined,
      ...props,
    };

    if (variant === 'steps') {
      return (
        <ol ref={ref as RefObject<HTMLOListElement>} {...commonProps}>
          {children}
        </ol>
      );
    }

    return (
      <ul ref={ref as RefObject<HTMLUListElement>} {...commonProps}>
        {children}
      </ul>
    );
  },
);

const ListItem = forwardRef<HTMLLIElement, ListItemProps>(({ icon, children, className, ...props }, ref) => (
  <li ref={ref} className={cn('list-row', className)} data-icon={icon ? '' : undefined} {...props}>
    {icon && <span className="list-row-icon">{icon}</span>}
    {children}
  </li>
));

const StepListItem = ListItem;

const GridListItem = forwardRef<HTMLLIElement, ListItemProps>(({ children, className, ...props }, ref) => (
  <ListItem ref={ref} className={className} icon={<span className="list-dot" />} data-grid="" {...props}>
    {children}
  </ListItem>
));

List.displayName = 'List';
ListItem.displayName = 'ListItem';
GridListItem.displayName = 'GridListItem';

export default List;
export { ListItem, StepListItem, GridListItem };
