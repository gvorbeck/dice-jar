import React, { useState, useId, useMemo, useCallback } from 'react';
import { TextInput } from '@/components/ui/core/primitives';
import { Card, Typography } from '@/components/ui/core/display';
import { useDebounce } from '@/hooks';
import { cn } from '@dice-jar/cn';
import './Accordion.css';

interface AccordionItem {
  name: string;
  [key: string]: unknown;
}

interface AccordionProps<T extends AccordionItem> {
  items: T[];
  sortBy: keyof T;
  labelProperty?: keyof T;
  searchPlaceholder?: string;
  renderItem: (item: T, index: number) => React.ReactNode;
  className?: string;
  showCounts?: boolean; // Optional prop to show/hide item counts
  showSearch?: boolean; // Optional prop to show/hide search bar
}

interface AccordionSectionProps {
  title: string;
  children: React.ReactNode;
  isExpanded: boolean;
  onToggle: () => void;
  sectionId: string;
  itemCount: number;
  showCount?: boolean; // Optional prop to show/hide item count
}

const AccordionSection: React.FC<AccordionSectionProps> = ({
  title,
  children,
  isExpanded,
  onToggle,
  sectionId,
  itemCount,
  showCount = true,
}) => {
  const contentId = `${sectionId}-content`;

  return (
    <div className="accordion-section">
      <button type="button" aria-expanded={isExpanded} aria-controls={contentId} onClick={onToggle} className="accordion-head">
        <span className="accordion-title">
          <span>{title.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}</span>
          {showCount && <span className="accordion-count">({itemCount})</span>}
        </span>
        <span aria-hidden="true" className="accordion-arrow">
          ▶
        </span>
      </button>

      {isExpanded && (
        <div id={contentId} className="accordion-body" role="region" aria-labelledby={sectionId}>
          {children}
        </div>
      )}
    </div>
  );
};

function Accordion<T extends AccordionItem>({
  items,
  sortBy,
  labelProperty = 'name' as keyof T,
  searchPlaceholder = 'Search items...',
  renderItem,
  className,
  showCounts = true,
  showSearch = true,
}: AccordionProps<T>) {
  const accordionId = useId();
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

  // Pre-compute sorted items to avoid re-sorting on every search
  const sortedItems = useMemo(() => {
    return items.sort((a, b) => String(a[labelProperty]).localeCompare(String(b[labelProperty])));
  }, [items, labelProperty]);

  // Filter and group items using debounced search term
  const { groupedItems, totalFilteredCount } = useMemo(() => {
    const searchLower = debouncedSearchTerm.toLowerCase();
    const filtered = searchLower ? sortedItems.filter((item) => item.name.toLowerCase().includes(searchLower)) : sortedItems;

    const grouped = filtered.reduce(
      (acc, item) => {
        const category = String(item[sortBy]);
        if (!acc[category]) {
          acc[category] = [];
        }
        acc[category].push(item);
        return acc;
      },
      {} as Record<string, T[]>,
    );

    // Categories are already sorted due to pre-sorted items
    const sortedGrouped: Record<string, T[]> = {};
    Object.keys(grouped)
      .sort()
      .forEach((category) => {
        const categoryItems = grouped[category];
        if (categoryItems) {
          sortedGrouped[category] = categoryItems;
        }
      });

    return {
      groupedItems: sortedGrouped,
      totalFilteredCount: filtered.length,
    };
  }, [sortedItems, sortBy, debouncedSearchTerm]);

  const handleSectionToggle = useCallback((category: string) => {
    setExpandedSections((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(category)) {
        newSet.delete(category);
      } else {
        newSet.add(category);
      }
      return newSet;
    });
  }, []);

  const handleSearchChange = useCallback((value: string) => {
    setSearchTerm(value);
  }, []);

  // Track previous debounced search term for auto-expand logic
  const [prevDebouncedSearchTerm, setPrevDebouncedSearchTerm] = useState(debouncedSearchTerm);

  // Auto-expand sections when search is applied during render
  if (debouncedSearchTerm !== prevDebouncedSearchTerm) {
    setPrevDebouncedSearchTerm(debouncedSearchTerm);
    if (debouncedSearchTerm.trim()) {
      setExpandedSections(new Set(Object.keys(groupedItems)));
    }
  }

  const handleSearchClear = useCallback(() => {
    setSearchTerm('');
    setExpandedSections(new Set()); // Collapse all sections when clearing
  }, []);

  return (
    <div className={cn('accordion', className)}>
      {/* Search/Filter Bar */}
      {showSearch && (
        <Card variant="standard">
          <TextInput
            value={searchTerm}
            onChange={handleSearchChange}
            onClear={handleSearchClear}
            placeholder={searchPlaceholder}
            aria-label="Filter accordion items"
            aria-describedby={`${accordionId}-description`}
          />
          <div id={`${accordionId}-description`} aria-live="polite" className="accordion-note">
            {debouncedSearchTerm ? `Showing ${totalFilteredCount} items matching "${debouncedSearchTerm}"` : `${items.length} total items`}
          </div>
        </Card>
      )}

      {/* Accordion Sections */}
      <div role="region" aria-label="Accordion content">
        {Object.keys(groupedItems).length === 0 ? (
          <div className="accordion-empty">
            <Typography variant="body" color="muted">
              {debouncedSearchTerm ? 'No items match your search.' : 'No items available.'}
            </Typography>
          </div>
        ) : (
          Object.entries(groupedItems).map(([category, categoryItems]) => (
            <AccordionSection
              key={category}
              title={category}
              isExpanded={expandedSections.has(category)}
              onToggle={() => handleSectionToggle(category)}
              sectionId={`${accordionId}-section-${category}`}
              itemCount={categoryItems.length}
              showCount={showCounts}
            >
              <div role="list">
                {categoryItems.map((item, index) => (
                  <div key={`${category}-${index}`} role="listitem" className="accordion-item">
                    {renderItem(item, index)}
                  </div>
                ))}
              </div>
            </AccordionSection>
          ))
        )}
      </div>
    </div>
  );
}

export default Accordion;
