import { describe, expect, it } from 'vitest';
import { changedById, mergeById } from './gameMutations';

const e = (id: string, v = 0) => ({ id, v });

describe('mergeById', () => {
  it('replaces the entries it names in place and leaves every other stored entry alone', () => {
    expect(mergeById([e('a', 1), e('b', 1), e('c', 1)], [e('b', 2)])).toEqual([e('a', 1), e('b', 2), e('c', 1)]);
  });
  it('appends new ids after the stored ones', () => {
    expect(mergeById([e('a'), e('b')], [e('c')])).toEqual([e('a'), e('b'), e('c')]);
  });
  it('removes only the ids named as removed, and keeps entries another tab added', () => {
    expect(mergeById([e('a'), e('b'), e('x')], [e('a')], ['b'])).toEqual([e('a'), e('x')]);
  });
  it('never re-adds a removed id that the incoming list still carries', () => {
    expect(mergeById([e('a')], [e('a'), e('b')], ['b'])).toEqual([e('a')]);
  });
  it('treats a missing stored list as empty', () => {
    expect(mergeById(undefined, [e('a')])).toEqual([e('a')]);
  });
});

describe('changedById', () => {
  it('returns only new or edited entries', () => {
    expect(changedById([e('a', 1), e('b', 1)], [e('a', 1), e('b', 2), e('c', 1)])).toEqual([e('b', 2), e('c', 1)]);
  });
  it('returns nothing when nothing changed, or when an entry was only removed', () => {
    expect(changedById([e('a'), e('b')], [e('a'), e('b')])).toEqual([]);
    expect(changedById([e('a'), e('b')], [e('a')])).toEqual([]);
  });
  // The case that broke: tab 1 edits card A and tab 2 edits card B before either sees the other.
  it('lets two tabs edit different entries without one restoring the other’s old value', () => {
    const stored = [e('a', 0), e('b', 0)];
    const tab1 = changedById(stored, [e('a', 1), e('b', 0)]);
    const tab2 = changedById(stored, [e('a', 0), e('b', 1)]);
    expect(mergeById(mergeById(stored, tab1), tab2)).toEqual([e('a', 1), e('b', 1)]);
  });
});
