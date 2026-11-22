import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { GridListItem } from './List';
import List from './List';
import StatCard from './StatCard';
import { StatGrid } from './StatGrid';
import StatusIndicator from './StatusIndicator';
import Table from './Table';

describe('StatusIndicator', () => {
  it('picks the tone and label from the percentage', () => {
    const { container } = render(<StatusIndicator current={6} max={10} />);
    expect(container.firstElementChild).toHaveAttribute('data-tone', 'yellow');
    expect(screen.getByText('Lightly Wounded')).toBeInTheDocument();
    expect(container.querySelector('progress')).toHaveAttribute('value', '60');
  });

  it('shows temporary hit points above the maximum', () => {
    render(<StatusIndicator current={12} max={10} showBar={false} />);
    expect(screen.getByText('Temporary HP')).toBeInTheDocument();
  });
});

describe('List', () => {
  it('renders steps as an ordered list and the rest as unordered', () => {
    const { container, rerender } = render(<List variant="steps">{<li>a</li>}</List>);
    expect(container.querySelector('ol')).toHaveAttribute('data-variant', 'steps');
    rerender(
      <List variant="grid" spacing="tight">
        <GridListItem>b</GridListItem>
      </List>,
    );
    expect(container.querySelector('ul')).toHaveAttribute('data-spacing', 'tight');
  });
});

describe('Table', () => {
  const columns = [{ key: 'name', header: 'Name' }];

  it('renders rows, clicks and the empty message', () => {
    const clicked: number[] = [];
    const { rerender } = render(<Table columns={columns} data={[{ name: 'Orc' }]} onRowClick={(_row, i) => clicked.push(i)} />);
    screen.getByRole('button', { name: 'Orc' }).click();
    expect(clicked).toEqual([0]);
    rerender(<Table columns={columns} data={[]} emptyMessage="Nothing here" />);
    expect(screen.getByRole('status')).toHaveTextContent('Nothing here');
  });

  it('marks the sorted column with aria-sort and reports clicks', () => {
    const sorts: string[] = [];
    const sortable = [{ key: 'name', header: 'Name', sortable: true }];
    const { rerender } = render(<Table columns={sortable} data={[{ name: 'Orc' }]} onSort={(key, dir) => sorts.push(`${key}:${dir}`)} />);
    const th = screen.getByRole('button', { name: 'Name' });
    expect(th).toHaveAttribute('aria-sort', 'none');
    th.click();
    expect(sorts).toEqual(['name:asc']);
    rerender(<Table columns={sortable} data={[{ name: 'Orc' }]} sort={{ key: 'name', direction: 'desc' }} />);
    expect(screen.getByRole('button', { name: 'Name' })).toHaveAttribute('aria-sort', 'descending');
  });

  it('shows skeleton rows while loading', () => {
    render(<Table columns={columns} data={[]} loading caption="Foes" />);
    expect(screen.getByText('Foes - Loading')).toBeInTheDocument();
  });
});

describe('StatCard and StatGrid', () => {
  it('titles the card with its full name', () => {
    render(<StatCard label="XP" value="1,000" size="sm" fullName="Experience Points" />);
    expect(screen.getByTitle('Experience Points')).toHaveAttribute('data-size', 'sm');
  });

  it('shortens ability labels and signs the modifier', () => {
    render(<StatGrid stats={[{ label: 'Strength', value: 14, modifier: 1 }]} />);
    expect(screen.getByText('Str')).toBeInTheDocument();
    expect(screen.getByText('+1')).toBeInTheDocument();
  });
});
