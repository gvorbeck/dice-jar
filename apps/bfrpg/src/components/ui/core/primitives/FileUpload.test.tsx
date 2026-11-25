import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import FileUpload from './FileUpload';

const onFileSelect = vi.fn();
const png = (name = 'a.png', bytes = 10) => new File([new Uint8Array(bytes)], name, { type: 'image/png' });
const setup = (props = {}) => render(<FileUpload label="Avatar" onFileSelect={onFileSelect} {...props} />);
const input = () => screen.getByLabelText(/Avatar/) as HTMLInputElement;

beforeEach(() => {
  onFileSelect.mockReset();
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

describe('FileUpload', () => {
  it('takes a file, shows its name, and can change or remove it', async () => {
    const user = userEvent.setup();
    setup();
    const file = png();
    await user.upload(input(), file);
    expect(onFileSelect).toHaveBeenCalledWith(file);
    expect(screen.getByText('a.png')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Change selected file: a.png/ })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Remove File' }));
    expect(onFileSelect).toHaveBeenLastCalledWith(null);
    expect(screen.getByRole('button', { name: /select a file/ })).toBeInTheDocument();
  });

  it('refuses a file that is too big', () => {
    setup({ maxSizeBytes: 1024 * 1024 });
    fireEvent.change(input(), { target: { files: [png('big.png', 2 * 1024 * 1024)] } });
    expect(onFileSelect).not.toHaveBeenCalled();
    expect(console.error).toHaveBeenCalledWith('File validation error:', 'File size must be less than 1MB');
  });

  it('refuses a type it was not asked for, and accepts one by extension', () => {
    setup({ accept: '.pdf, image/*' });
    fireEvent.change(input(), { target: { files: [new File(['x'], 'notes.txt', { type: 'text/plain' })] } });
    expect(onFileSelect).not.toHaveBeenCalled();
    fireEvent.change(input(), { target: { files: [new File(['x'], 'sheet.PDF', { type: 'application/pdf' })] } });
    expect(onFileSelect).toHaveBeenCalledTimes(1);
  });

  it('takes a dropped file, and lights up while one is over it', () => {
    setup();
    const zone = document.querySelector('.upload-zone')!;
    fireEvent.dragOver(zone);
    expect(zone).toHaveAttribute('data-over', 'true');
    expect(screen.getByRole('button', { name: /Click to select a file or drag/ })).toHaveTextContent('Drop your file here');
    fireEvent.dragLeave(zone);
    expect(zone).not.toHaveAttribute('data-over');
    const file = png('drop.png');
    fireEvent.drop(zone, { dataTransfer: { files: [file] } });
    expect(onFileSelect).toHaveBeenCalledWith(file);
  });

  it('ignores drags and drops while disabled', () => {
    setup({ disabled: true });
    const zone = document.querySelector('.upload-zone')!;
    fireEvent.dragOver(zone);
    expect(zone).not.toHaveAttribute('data-over');
    fireEvent.drop(zone, { dataTransfer: { files: [png()] } });
    expect(onFileSelect).not.toHaveBeenCalled();
  });

  it('shows the helper text and an error, and marks the input invalid', () => {
    setup({ helperText: 'Max 5MB', error: 'Pick a file', required: true });
    expect(screen.getByText('Max 5MB')).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent('Pick a file');
    expect(input()).toBeInvalid();
    expect(input()).toBeRequired();
    expect(input().getAttribute('aria-describedby')).toContain('-error');
  });
});
