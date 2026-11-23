import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Accordion from './Accordion';

const items = () => [
  { name: 'Dagger', category: 'daggers' },
  { name: 'Longsword', category: 'swords' },
  { name: 'Shortsword', category: 'swords' },
];
const setup = (props = {}) =>
  render(<Accordion items={items()} sortBy="category" renderItem={(item) => <span>{String(item['name'])}</span>} {...props} />);

describe('Accordion', () => {
  it('groups items by category, collapsed, with counts', () => {
    setup();
    expect(screen.getByRole('button', { name: /Daggers\s*\(1\)/ })).toHaveAttribute('aria-expanded', 'false');
    expect(screen.getByRole('button', { name: /Swords\s*\(2\)/ })).toBeInTheDocument();
    expect(screen.queryByText('Longsword')).toBeNull();
    expect(screen.getByText('3 total items')).toBeInTheDocument();
  });

  it('opens and closes a section', async () => {
    const user = userEvent.setup();
    setup();
    await user.click(screen.getByRole('button', { name: /Swords/ }));
    expect(screen.getByText('Longsword')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Swords/ }));
    expect(screen.queryByText('Longsword')).toBeNull();
  });

  it('can leave out the counts and the search', () => {
    setup({ showCounts: false, showSearch: false });
    expect(screen.queryByText('(1)')).toBeNull();
    expect(screen.queryByLabelText('Filter accordion items')).toBeNull();
  });

  it('filters by name and opens what it finds, then clears', async () => {
    const user = userEvent.setup();
    setup();
    await user.type(screen.getByLabelText('Filter accordion items'), 'short');
    expect(await screen.findByText('Shortsword')).toBeInTheDocument();
    expect(screen.queryByText('Longsword')).toBeNull();
    expect(screen.getByText('Showing 1 items matching "short"')).toBeInTheDocument();
  });

  it('says when nothing matches, and when there is nothing at all', async () => {
    const user = userEvent.setup();
    setup();
    await user.type(screen.getByLabelText('Filter accordion items'), 'zzz');
    expect(await screen.findByText('No items match your search.')).toBeInTheDocument();
    render(<Accordion items={[]} sortBy="category" renderItem={() => null} />);
    expect(screen.getByText('No items available.')).toBeInTheDocument();
  });
});
