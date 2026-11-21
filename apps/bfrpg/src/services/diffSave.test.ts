import { describe, it, expect, vi, beforeEach } from 'vitest';

const fs = vi.hoisted(() => ({
  getDoc: vi.fn(),
  setDoc: vi.fn(),
  updateDoc: vi.fn(),
}));
vi.mock('firebase/firestore', () => ({
  ...fs,
  FieldPath: class {
    constructor(public path: string[]) {}
  },
  deleteField: () => 'DELETE',
}));

import { saveDiff } from './diffSave';

const ref = {} as never;

describe('saveDiff', () => {
  beforeEach(() => vi.clearAllMocks());

  it('writes a new document whole', async () => {
    await saveDiff(ref, 'new', { a: 1 });
    expect(fs.setDoc).toHaveBeenCalledWith(ref, { a: 1 });
    expect(fs.getDoc).not.toHaveBeenCalled();
  });

  it('reads a named document this tab never read, and sends only what changed', async () => {
    fs.getDoc.mockResolvedValue({ exists: () => true, data: () => ({ a: 1, b: 2 }) });
    await saveDiff(ref, 'named', { a: 1, b: 3 }, true);
    expect(fs.setDoc).not.toHaveBeenCalled();
    expect(fs.updateDoc).toHaveBeenCalledTimes(1);
  });

  it('writes a named document whole when it does not exist yet', async () => {
    fs.getDoc.mockResolvedValue({ exists: () => false });
    await saveDiff(ref, 'named-new', { a: 1 }, true);
    expect(fs.setDoc).toHaveBeenCalledWith(ref, { a: 1 });
  });
});
