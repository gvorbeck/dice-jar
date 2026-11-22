import { forwardRef, useCallback } from 'react';
import type { ReactNode, HTMLAttributes, ThHTMLAttributes, TdHTMLAttributes } from 'react';
import { cn } from '@dice-jar/cn';
import './Table.css';
import { SkeletonTableRow } from '@/components/ui/core/feedback';

// Constants
const HEADER_ROW_OFFSET = 2; // Header row is index 1, data rows start at 2

// Table Column Definition
export interface TableColumn<T = Record<string, unknown>> {
  /** Unique identifier for the column */
  key: string;
  /** Column header text */
  header: ReactNode;
  /** Function to render cell content, receives row data */
  cell?: (data: T) => ReactNode;
  /** Column width (CSS width value) */
  width?: string;
  /** Text alignment */
  align?: 'left' | 'center' | 'right';
  /** Whether column is sortable */
  sortable?: boolean;
  /** Accessibility label for the column */
  ariaLabel?: string;
}

// Table Props
interface TableProps<T = Record<string, unknown>> extends Omit<HTMLAttributes<HTMLTableElement>, 'children'> {
  /** Array of column definitions */
  columns: TableColumn<T>[];
  /** Array of data objects to display */
  data: T[];
  /** Table caption for accessibility */
  caption?: string;
  /** Whether to use striped rows */
  striped?: boolean;
  /** Whether to highlight rows on hover */
  hoverable?: boolean;
  /** Size variant */
  size?: 'sm' | 'md';
  /** Loading state */
  loading?: boolean;
  /** Empty state message */
  emptyMessage?: string;
  /** Sort configuration */
  sort?: {
    key: string;
    direction: 'asc' | 'desc';
  };
  /** Sort change handler */
  onSort?: (key: string, direction: 'asc' | 'desc') => void;
  /** Row click handler */
  onRowClick?: (data: T, index: number) => void;
  /** Custom row key extractor */
  getRowKey?: (data: T, index: number) => string;
}

// Table Header Cell Props
interface TableHeaderProps extends ThHTMLAttributes<HTMLTableHeaderCellElement> {
  sortable?: boolean;
  sorted?: 'asc' | 'desc' | null;
  onSort?: () => void;
  align?: 'left' | 'center' | 'right';
}

// Table Cell Props
interface TableCellProps extends TdHTMLAttributes<HTMLTableDataCellElement> {
  align?: 'left' | 'center' | 'right';
}

// Helper function for better type safety
const getCellContent = <T extends Record<string, unknown>>(row: T, column: TableColumn<T>): ReactNode => {
  if (column.cell) {
    return column.cell(row);
  }

  const value = row[column.key as keyof T];
  return value as ReactNode;
};

// Table Header Cell Component
const TableHeader = forwardRef<HTMLTableHeaderCellElement, TableHeaderProps>(
  ({ children, sortable = false, sorted = null, onSort, align = 'left', ...props }, ref) => (
    <th
      ref={ref}
      data-align={align}
      data-sortable={sortable || undefined}
      onClick={sortable ? onSort : undefined}
      role={sortable ? 'button' : undefined}
      tabIndex={sortable ? 0 : undefined}
      aria-sort={sorted === 'asc' ? 'ascending' : sorted === 'desc' ? 'descending' : sortable ? 'none' : undefined}
      onKeyDown={
        sortable
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onSort?.();
              }
            }
          : undefined
      }
      {...props}
    >
      <div>{children}</div>
    </th>
  ),
);

TableHeader.displayName = 'TableHeader';

// Table Cell Component
const TableCell = forwardRef<HTMLTableDataCellElement, TableCellProps>(({ children, align = 'left', ...props }, ref) => (
  <td ref={ref} data-align={align} {...props}>
    {children}
  </td>
));

TableCell.displayName = 'TableCell';

// Main Table Component
const Table = forwardRef<HTMLTableElement, TableProps>(
  (
    {
      columns,
      data,
      caption,
      striped = false,
      hoverable = true,
      size = 'md',
      loading = false,
      emptyMessage = 'No data available',
      sort,
      onSort,
      onRowClick,
      getRowKey,
      className,
      ...props
    },
    ref,
  ) => {
    const handleSort = useCallback(
      (columnKey: string) => {
        if (!onSort) return;

        const newDirection = sort?.key === columnKey && sort?.direction === 'asc' ? 'desc' : 'asc';

        onSort(columnKey, newDirection);
      },
      [onSort, sort],
    );

    const getDefaultRowKey = useCallback(
      (rowData: Record<string, unknown>, index: number): string => {
        if (getRowKey) return getRowKey(rowData as never, index);
        return (rowData['id'] as string | number | undefined)?.toString() ?? index.toString();
      },
      [getRowKey],
    );

    if (!loading && data.length === 0) {
      return (
        <div className="table-empty" role="status" aria-live="polite">
          <span>{emptyMessage}</span>
        </div>
      );
    }

    return (
      <div className="table-wrap">
        <table ref={ref} className={cn('table', className)} data-size={size} data-hoverable={hoverable || undefined} {...props}>
          {caption && <caption>{loading ? `${caption} - Loading` : caption}</caption>}

          <thead>
            <tr>
              {columns.map((column) => (
                <TableHeader
                  key={column.key}
                  {...(column.width && { width: column.width })}
                  align={column.align ?? 'left'}
                  sortable={!loading && (column.sortable ?? false)}
                  sorted={!loading && sort?.key === column.key ? sort.direction : null}
                  onSort={() => handleSort(column.key)}
                  aria-label={column.ariaLabel}
                >
                  {column.header}
                </TableHeader>
              ))}
            </tr>
          </thead>

          <tbody>
            {loading
              ? Array.from({ length: 3 }).map((_, index) => (
                  <tr key={index}>
                    {columns.map((column, colIndex) => (
                      <TableCell key={`${index}-${column.key}`} align={column.align ?? 'left'}>
                        <SkeletonTableRow size="sm" width={colIndex === 0 ? '60%' : '40%'} label="Loading table data..." />
                      </TableCell>
                    ))}
                  </tr>
                ))
              : data.map((row, index) => {
                  const rowKey = getDefaultRowKey(row, index);
                  const isClickable = !!onRowClick;

                  return (
                    <tr
                      key={rowKey}
                      data-stripe={(striped && index % 2 === 1) || undefined}
                      data-clickable={isClickable || undefined}
                      onClick={isClickable ? () => onRowClick(row, index) : undefined}
                      onKeyDown={
                        isClickable
                          ? (e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                onRowClick?.(row, index);
                              }
                            }
                          : undefined
                      }
                      role={isClickable ? 'button' : undefined}
                      tabIndex={isClickable ? 0 : undefined}
                      aria-rowindex={index + HEADER_ROW_OFFSET}
                    >
                      {columns.map((column) => (
                        <TableCell key={`${rowKey}-${column.key}`} align={column.align ?? 'left'}>
                          {getCellContent(row, column)}
                        </TableCell>
                      ))}
                    </tr>
                  );
                })}
          </tbody>
        </table>
      </div>
    );
  },
);

Table.displayName = 'Table';

export default Table;
