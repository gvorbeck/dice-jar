import { forwardRef, useState, useCallback } from 'react';
import { SectionHeader } from '@/components';
import { cn } from '@dice-jar/cn';
import './SectionWrapper.css';
import { store } from '@dice-jar/browser';

interface SectionWrapperProps {
  title: React.ReactNode;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  collapsible?: boolean;
  collapsibleKey?: string; // Optional key for localStorage persistence
}

const SectionWrapper = forwardRef<HTMLDivElement, SectionWrapperProps>(
  ({ title, className, size = 'md', children, collapsible = false, collapsibleKey }, ref) => {
    // With a key, the choice is remembered across visits.
    const storageKey = collapsibleKey && `section-collapsed:${collapsibleKey}`;
    const [isCollapsed, setIsCollapsed] = useState(() => (storageKey ? store.get(storageKey) === '1' : false));

    const toggleCollapse = useCallback(
      (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsCollapsed(!isCollapsed);
        if (storageKey) store.set(storageKey, isCollapsed ? '0' : '1');
      },
      [isCollapsed, storageKey],
    );

    // Create collapse button as extra content if collapsible
    const collapseButton = collapsible ? (
      <button
        type="button"
        onClick={toggleCollapse}
        className="section-toggle"
        data-collapsed={isCollapsed || undefined}
        aria-label={isCollapsed ? 'Expand section' : 'Collapse section'}
        aria-expanded={!isCollapsed}
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
    ) : undefined;

    return (
      <div ref={ref} className={cn('section', className)}>
        <SectionHeader title={title} extra={collapseButton} size={size} />
        {!isCollapsed && children}
      </div>
    );
  },
);

SectionWrapper.displayName = 'SectionWrapper';

export default SectionWrapper;
