import { useCallback, useEffect, useRef } from 'react';
import { cn } from '@dice-jar/cn';
import { Button, Heading, Text, Checkbox, Input, Radio, RadioGroup } from '@/components/ui';
import { useOptimisticField } from '@/hooks/useOptimisticField';
import { changedById } from '@/lib/gameMutations';
import type { SteadingData, GmImprovement } from '@/types';
import { makeEmptyGmImprovement } from './steadingImprovementsData';
import './improvementCard.css';
import './GmImprovementSlots.css';

interface GmImprovementCardProps {
  slot: GmImprovement;
  index: number;
  onFocus: () => void;
  onBlur: () => void;
  onChange: (index: number, patch: Partial<GmImprovement>) => void;
  onCategoryChange: (index: number, category: GmImprovement['category']) => void;
  onCompletedToggle: (index: number) => void;
  onRemove: (index: number) => void;
}

const GmImprovementCard = ({
  slot,
  index,
  onFocus,
  onBlur,
  onChange,
  onCategoryChange,
  onCompletedToggle,
  onRemove,
}: GmImprovementCardProps) => {
  const handleTitleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => onChange(index, { title: e.target.value }),
    [index, onChange],
  );
  const handleSummaryChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => onChange(index, { summary: e.target.value }),
    [index, onChange],
  );
  const handleRequirementsChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => onChange(index, { requirements: e.target.value }),
    [index, onChange],
  );
  const handleEffectsChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => onChange(index, { effects: e.target.value }),
    [index, onChange],
  );
  const handleCategoryResource = useCallback(() => onCategoryChange(index, 'resource'), [index, onCategoryChange]);
  const handleCategoryFortification = useCallback(() => onCategoryChange(index, 'fortification'), [index, onCategoryChange]);
  const handleCategoryAsset = useCallback(() => onCategoryChange(index, 'asset'), [index, onCategoryChange]);
  const handleCompletedToggle = useCallback(() => onCompletedToggle(index), [index, onCompletedToggle]);
  const handleRemove = useCallback(() => onRemove(index), [index, onRemove]);

  const slotCx = cn('improvement-card-item', 'gm-improvement-slots-gm-item', slot.completed && 'improvement-card-item-completed');

  return (
    <div className={slotCx}>
      <div className="improvement-card-item-header">
        <Checkbox checked={slot.completed} onChange={handleCompletedToggle} className="improvement-card-item-checkbox" />
        <Input
          aria-label="Improvement name"
          className="gm-improvement-slots-gm-title-input"
          value={slot.title}
          placeholder="IMPROVEMENT"
          onFocus={onFocus}
          onChange={handleTitleChange}
          onBlur={onBlur}
        />
        <Button variant="ghost" size="sm" icon="close" aria-label="Remove improvement" onClick={handleRemove} />
      </div>
      <Input
        multiline
        aria-label="Summary"
        className="gm-improvement-slots-gm-textarea"
        value={slot.summary}
        placeholder="Summary"
        rows={2}
        onFocus={onFocus}
        onChange={handleSummaryChange}
        onBlur={onBlur}
      />
      <RadioGroup legend="Category" legendHidden className="gm-improvement-slots-category-row">
        <Radio
          name={`gm-improvement-category-${slot.id}`}
          value="resource"
          label="Resource"
          className="gm-improvement-slots-category-radio"
          checked={slot.category === 'resource'}
          onChange={handleCategoryResource}
        />
        <Radio
          name={`gm-improvement-category-${slot.id}`}
          value="fortification"
          label="Fortification"
          className="gm-improvement-slots-category-radio"
          checked={slot.category === 'fortification'}
          onChange={handleCategoryFortification}
        />
        <Radio
          name={`gm-improvement-category-${slot.id}`}
          value="asset"
          label="Asset"
          className="gm-improvement-slots-category-radio"
          checked={slot.category === 'asset'}
          onChange={handleCategoryAsset}
        />
      </RadioGroup>
      <div className="improvement-card-section">
        <Heading as="h4" size="label">
          Requirements
        </Heading>
        <Input
          multiline
          aria-label="Requirements"
          className="gm-improvement-slots-gm-textarea"
          value={slot.requirements}
          placeholder="Requirements"
          rows={3}
          onFocus={onFocus}
          onChange={handleRequirementsChange}
          onBlur={onBlur}
        />
      </div>
      <div className="improvement-card-section">
        <Heading as="h4" size="label">
          Effects
        </Heading>
        <Input
          multiline
          aria-label="Effects"
          className="gm-improvement-slots-gm-textarea"
          value={slot.effects}
          placeholder="Effects"
          rows={3}
          onFocus={onFocus}
          onChange={handleEffectsChange}
          onBlur={onBlur}
        />
      </div>
    </div>
  );
};

interface GmImprovementSlotsProps {
  gmImprovements: GmImprovement[] | undefined;
  onSave: (patch: Partial<SteadingData>) => Promise<void>;
}

export const GmImprovementSlots = ({ gmImprovements, onSave }: GmImprovementSlotsProps) => {
  // A text field's edits aren't written until blur, so while one is focused remote
  // echoes must be held back or they'd clobber the in-flight typing. This is a
  // separate concern from the save-pending gate — a category/completed toggle can
  // save *while* a title field is still focused — so it's passed to the hook as its
  // own gate rather than folded into pendingRef.
  const focusedRef = useRef(false);
  // The list this tab last read or wrote. Diffs are taken against it, not the latest props: while a
  // field is focused props advance but the local list is frozen, and a stale entry would overwrite another tab's edit.
  const baselineRef = useRef(gmImprovements ?? []);
  const inFlightRef = useRef<Set<string>[]>([]);
  useEffect(() => {
    if (!focusedRef.current) baselineRef.current = gmImprovements ?? [];
  }, [gmImprovements]);

  const {
    value: localSlots,
    ref: localSlotsRef,
    setValue: setLocalSlots,
    save: saveSlots,
  } = useOptimisticField<GmImprovement[], [removedId?: string]>(
    gmImprovements ?? [],
    // The baseline advances only once the write lands, so a failed save is resent. Entries in a save still in
    // flight are resent too: a quick second edit (toggle, untoggle) must not diff equal to the old baseline.
    async (slots, removedId): Promise<void> => {
      const ids = new Set(changedById(baselineRef.current, slots).map((e) => e.id));
      const inFlight = new Set(inFlightRef.current.flatMap((set) => [...set]));
      const mine = new Set([...ids, ...inFlight]);
      inFlightRef.current.push(ids);
      try {
        await onSave({
          gmImprovements: slots.filter((e) => mine.has(e.id)),
          ...(removedId ? { removedGmImprovementIds: [removedId] } : {}),
        });
        baselineRef.current = slots;
      } finally {
        inFlightRef.current = inFlightRef.current.filter((set) => set !== ids);
      }
    },
    undefined,
    focusedRef,
  );

  const handleSlotFocus = useCallback(() => {
    focusedRef.current = true;
    baselineRef.current = localSlotsRef.current;
  }, [localSlotsRef]);

  // Optimistic-only update while typing; the write is deferred to blur.
  const handleSlotChange = useCallback(
    (index: number, patch: Partial<GmImprovement>) => {
      setLocalSlots((prev) => prev.map((s, i) => (i === index ? { ...s, ...patch } : s)));
    },
    [setLocalSlots],
  );

  const handleSlotBlur = useCallback(() => {
    focusedRef.current = false;
    saveSlots(localSlotsRef.current);
  }, [saveSlots, localSlotsRef]);

  // These can fire while a title field is still focused. The focus gate is held by
  // focusedRef independently of save settlement, so they need no follow-up re-pin.
  const handleSlotCategoryChange = useCallback(
    (index: number, category: GmImprovement['category']) => {
      saveSlots((prev) => prev.map((s, i) => (i === index ? { ...s, category } : s)));
    },
    [saveSlots],
  );

  const handleSlotCompletedToggle = useCallback(
    (index: number) => {
      saveSlots((prev) => prev.map((s, i) => (i === index ? { ...s, completed: !s.completed } : s)));
    },
    [saveSlots],
  );

  const handleAdd = useCallback(() => {
    saveSlots((prev) => [...prev, makeEmptyGmImprovement()]);
  }, [saveSlots]);

  const handleRemove = useCallback(
    (index: number) => {
      const removedId = localSlotsRef.current[index]?.id;
      saveSlots((prev) => prev.filter((_, i) => i !== index), removedId);
    },
    [saveSlots, localSlotsRef],
  );

  return (
    <div className="gm-improvement-slots-gm-slots">
      <Heading as="h3" size="sm">
        Other improvements
      </Heading>
      <Text size="xs" color="muted">
        Additional possible improvements to Stonetop, revealed by the GM.
      </Text>
      {localSlots.length > 0 && (
        <div className="gm-improvement-slots-gm-grid">
          {localSlots.map((slot, i) => (
            <GmImprovementCard
              key={slot.id}
              slot={slot}
              index={i}
              onFocus={handleSlotFocus}
              onBlur={handleSlotBlur}
              onChange={handleSlotChange}
              onCategoryChange={handleSlotCategoryChange}
              onCompletedToggle={handleSlotCompletedToggle}
              onRemove={handleRemove}
            />
          ))}
        </div>
      )}
      <Button variant="ghost" size="sm" icon="plus" onClick={handleAdd}>
        Add improvement
      </Button>
    </div>
  );
};
