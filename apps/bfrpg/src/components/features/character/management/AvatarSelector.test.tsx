import '@/utils'; // first: validation/rules and utils import each other, and this order is the one that loads
import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMockCharacter } from '@/test/helpers';
import AvatarSelector from './AvatarSelector';

const setup = (overrides = {}) => {
  const onCharacterChange = vi.fn();
  const character = createMockCharacter({ name: 'Brom', ...overrides });
  render(<AvatarSelector character={character} onCharacterChange={onCharacterChange} />);
  return { onCharacterChange, user: userEvent.setup() };
};
const lastAvatar = (fn: ReturnType<typeof vi.fn>) => fn.mock.lastCall![0].avatar;

describe('AvatarSelector', () => {
  it('offers twenty stock avatars and no current one to start', () => {
    setup();
    expect(screen.getAllByRole('button', { name: /^Select Avatar \d+ avatar$/ })).toHaveLength(20);
    expect(screen.queryByText('Current Avatar')).toBeNull();
  });

  it('picks a stock avatar', async () => {
    const { onCharacterChange, user } = setup();
    await user.click(screen.getByRole('button', { name: 'Select Avatar 1 avatar' }));
    expect(lastAvatar(onCharacterChange)).toBe('/avatars/cleric-man-1.webp');
  });

  it('shows the stock avatar chosen, by number, and removes it', async () => {
    const { onCharacterChange, user } = setup({ avatar: '/avatars/dwarf-man-1.webp' });
    expect(screen.getByText('Current Avatar')).toBeInTheDocument();
    expect(screen.getByText('Avatar 2')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Remove Avatar' }));
    expect(onCharacterChange.mock.lastCall![0]).not.toHaveProperty('avatar');
  });

  it('calls an uploaded image a custom upload', () => {
    setup({ avatar: 'data:image/png;base64,AAAA' });
    expect(screen.getByText('Custom Upload')).toBeInTheDocument();
  });

  it('stores an uploaded image as a data URL', async () => {
    const { onCharacterChange, user } = setup();
    const file = new File([new Uint8Array(10)], 'me.png', { type: 'image/png' });
    await user.upload(screen.getByLabelText(/Upload Avatar Image/), file);
    await waitFor(() => expect(onCharacterChange).toHaveBeenCalled());
    expect(lastAvatar(onCharacterChange)).toMatch(/^data:image\/png;base64,/);
  });

  it('refuses an image over 1 MB', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const { onCharacterChange, user } = setup();
    const big = new File([new Uint8Array(2 * 1024 * 1024)], 'big.png', { type: 'image/png' });
    await user.upload(screen.getByLabelText(/Upload Avatar Image/), big);
    expect(onCharacterChange).not.toHaveBeenCalled();
  });
});
