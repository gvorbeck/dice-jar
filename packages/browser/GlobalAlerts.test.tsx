// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { cleanup, render, screen, waitFor, fireEvent } from '@testing-library/react';
import { GlobalAlerts, parseAlerts, ALERTS_URL, type Alert } from './GlobalAlerts';

const everywhere: Alert = { id: 'a', type: 'info', message: 'For everyone', dismissible: true };
const onlyBfrpg: Alert = { id: 'b', type: 'warning', message: 'Only codex.quest', apps: ['bfrpg'] };
const respond = (body: unknown, ok = true) => vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok, json: () => Promise.resolve(body) }));

beforeEach(() => localStorage.clear());
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('parseAlerts', () => {
  it('keeps valid messages', () => {
    expect(parseAlerts({ alerts: [everywhere, onlyBfrpg] })).toEqual([everywhere, onlyBfrpg]);
  });

  it('drops a malformed one without losing the rest', () => {
    const bad = [
      null,
      'text',
      { id: '', type: 'info', message: 'no id' },
      { id: 'x', type: 'info', message: '' },
      { id: 'x', type: 'loud', message: 'unknown type' },
      { id: 'x', type: 'info', message: 'm', apps: 'bfrpg' },
      { id: 'x', type: 'info', message: 'm', apps: [1] },
      { id: 'x', type: 'info', message: 'm', dismissible: 'yes' },
    ];
    expect(parseAlerts({ alerts: [...bad, everywhere] })).toEqual([everywhere]);
  });

  it('gives nothing for a file that is not the expected shape', () => {
    for (const json of [null, [], 'x', {}, { alerts: 'x' }]) expect(parseAlerts(json)).toEqual([]);
  });
});

describe('GlobalAlerts', () => {
  it('reads the file from the landing page', async () => {
    respond({ alerts: [] });
    render(<GlobalAlerts app="bfrpg" />);
    await waitFor(() => expect(fetch).toHaveBeenCalledWith(ALERTS_URL, { cache: 'no-cache' }));
  });

  it('shows the messages for its app and for every app, not for another one', async () => {
    respond({ alerts: [everywhere, onlyBfrpg, { id: 'c', type: 'error', message: 'Only stonetop', apps: ['stonetop'] }] });
    render(<GlobalAlerts app="bfrpg" />);
    expect(await screen.findByText('For everyone')).toBeTruthy();
    expect(screen.getByText('Only codex.quest')).toBeTruthy();
    expect(screen.queryByText('Only stonetop')).toBeNull();
  });

  it('shows what the app adds itself, with no dismiss button', async () => {
    respond({ alerts: [] });
    render(<GlobalAlerts app="bfrpg" extra={[{ id: 'offline', type: 'warning', message: "You're offline", dismissible: true }]} />);
    expect(screen.getByRole('status').textContent).toBe("You're offline");
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('announces an error at once and the rest politely', async () => {
    respond({ alerts: [{ id: 'e', type: 'error', message: 'Down' }, everywhere] });
    render(<GlobalAlerts app="bfrpg" />);
    await screen.findByText('Down');
    expect(screen.getByText('Down').closest('[role]')?.getAttribute('role')).toBe('alert');
    expect(screen.getByText('For everyone').closest('[role]')?.getAttribute('role')).toBe('status');
  });

  it('dismisses a dismissible message, and keeps it dismissed on the next visit', async () => {
    respond({ alerts: [everywhere] });
    const first = render(<GlobalAlerts app="bfrpg" />);
    fireEvent.click(await screen.findByRole('button', { name: 'Dismiss: For everyone' }));
    expect(screen.queryByText('For everyone')).toBeNull();
    first.unmount();
    render(<GlobalAlerts app="bfrpg" />);
    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(2));
    expect(screen.queryByText('For everyone')).toBeNull();
  });

  it("keeps another tab's dismissals when it saves its own", async () => {
    const second: Alert = { id: 'd', type: 'info', message: 'Second', dismissible: true };
    respond({ alerts: [everywhere, second] });
    render(<GlobalAlerts app="bfrpg" />);
    await screen.findByText('Second');
    localStorage.setItem('dicejar:alerts-dismissed', JSON.stringify(['d'])); // another tab dismissed it
    fireEvent.click(screen.getAllByRole('button')[0]!);
    expect(JSON.parse(localStorage.getItem('dicejar:alerts-dismissed')!).sort()).toEqual(['a', 'd']);
  });

  it('ignores a damaged record of dismissals', async () => {
    localStorage.setItem('dicejar:alerts-dismissed', '{not json');
    respond({ alerts: [everywhere] });
    render(<GlobalAlerts app="bfrpg" />);
    expect(await screen.findByText('For everyone')).toBeTruthy();
  });

  it('gives no dismiss button to a message that is not dismissible', async () => {
    respond({ alerts: [onlyBfrpg] });
    render(<GlobalAlerts app="bfrpg" />);
    await screen.findByText('Only codex.quest');
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('shows nothing when the file cannot be read', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));
    const { container } = render(<GlobalAlerts app="bfrpg" />);
    await waitFor(() => expect(fetch).toHaveBeenCalled());
    expect(container.innerHTML).toBe('');
  });

  it('shows nothing for an error response', async () => {
    respond({ alerts: [everywhere] }, false);
    const { container } = render(<GlobalAlerts app="bfrpg" />);
    await waitFor(() => expect(fetch).toHaveBeenCalled());
    expect(container.innerHTML).toBe('');
  });
});
