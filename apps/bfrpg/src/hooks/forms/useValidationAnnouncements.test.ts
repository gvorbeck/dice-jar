import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useValidationAnnouncements } from './useValidationAnnouncements';

const announce = vi.fn();
vi.mock('../a11y/useA11y', () => ({ useA11yAnnouncements: () => ({ announce }) }));
beforeEach(() => announce.mockReset());
const hook = () => renderHook(() => useValidationAnnouncements()).result.current;

describe('useValidationAnnouncements', () => {
  it('announces one error plainly and several with a count', () => {
    const h = hook();
    h.announceValidationErrors(['Name is required'], 'Review');
    expect(announce).toHaveBeenLastCalledWith('Review: Name is required', 'assertive');
    h.announceValidationErrors(['Name is required', 'Pick a race']);
    expect(announce).toHaveBeenLastCalledWith('2 validation errors. First error: Name is required', 'assertive');
  });

  it('does not repeat errors it has already announced', () => {
    const h = hook();
    h.announceValidationErrors(['A']);
    announce.mockClear();
    h.announceValidationErrors(['A']);
    expect(announce).not.toHaveBeenCalled();
  });

  it('says when the errors are resolved, once', () => {
    const h = hook();
    h.announceValidationErrors(['A']);
    h.announceValidationErrors([], 'Race');
    expect(announce).toHaveBeenLastCalledWith('Race errors resolved', 'polite');
    announce.mockClear();
    h.announceValidationErrors([]);
    expect(announce).not.toHaveBeenCalled();
  });

  it('announces warnings politely', () => {
    const h = hook();
    h.announceValidationWarnings([]);
    expect(announce).not.toHaveBeenCalled();
    h.announceValidationWarnings(['Low HP']);
    expect(announce).toHaveBeenLastCalledWith('Warning: Low HP', 'polite');
    h.announceValidationWarnings(['A', 'B'], 'HP');
    expect(announce).toHaveBeenLastCalledWith('HP: 2 warnings. A', 'polite');
  });

  it('announces whether a step is done or blocked', () => {
    const h = hook();
    h.announceStepStatus('Race', true);
    expect(announce).toHaveBeenLastCalledWith('Race completed successfully', 'polite');
    h.announceStepStatus('Race', false, ['x']);
    expect(announce).toHaveBeenLastCalledWith('Race has 1 error that must be resolved', 'assertive');
    h.announceStepStatus('Race', false, ['x', 'y']);
    expect(announce).toHaveBeenLastCalledWith('Race has 2 errors that must be resolved', 'assertive');
    announce.mockClear();
    h.announceStepStatus('Race', false);
    expect(announce).not.toHaveBeenCalled();
  });

  it('announces progress and completion', () => {
    const h = hook();
    h.announceProgress(2, 4);
    expect(announce).toHaveBeenLastCalledWith('Character creation 50% complete. 2 of 4 steps finished.', 'polite');
    h.announceCharacterComplete('Brom');
    expect(announce).toHaveBeenLastCalledWith('Character Brom created successfully!', 'polite');
    h.announceCharacterComplete();
    expect(announce).toHaveBeenLastCalledWith('Character created successfully!', 'polite');
  });
});
