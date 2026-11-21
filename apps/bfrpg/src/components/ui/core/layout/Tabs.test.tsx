import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Tabs, TabList, Tab, TabPanels, TabPanel } from './Tabs';

const Sample = ({ ...props }: { defaultValue?: string; value?: string; onValueChange?: (v: string) => void }) => (
  <Tabs {...props}>
    <TabList aria-label="Demo">
      <Tab value="a">A</Tab>
      <Tab value="b">B</Tab>
    </TabList>
    <TabPanels>
      <TabPanel value="a">panel a</TabPanel>
      <TabPanel value="b">panel b</TabPanel>
    </TabPanels>
  </Tabs>
);

describe('Tabs', () => {
  it('starts on defaultValue and switches on click', async () => {
    render(<Sample defaultValue="b" />);
    expect(screen.getByRole('tab', { name: 'B' })).toHaveAttribute('aria-selected', 'true');
    await userEvent.click(screen.getByRole('tab', { name: 'A' }));
    expect(screen.getByText('panel a')).toBeInTheDocument();
  });

  it('reports the chosen value and follows a controlled value', async () => {
    const onValueChange = vi.fn();
    const { rerender } = render(<Sample value="a" onValueChange={onValueChange} />);
    await userEvent.click(screen.getByRole('tab', { name: 'B' }));
    expect(onValueChange).toHaveBeenCalledWith('b');
    expect(screen.getByText('panel a')).toBeInTheDocument(); // controlled: stays until the parent changes it
    rerender(<Sample value="b" onValueChange={onValueChange} />);
    expect(screen.getByText('panel b')).toBeInTheDocument();
  });
});
