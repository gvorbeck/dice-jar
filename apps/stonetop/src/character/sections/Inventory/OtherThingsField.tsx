import { useState, useRef, useCallback } from 'react';
import { useLatest } from '@dice-jar/browser';
import { useFirestoreSync } from '@dice-jar/browser';
import { useDebouncedSave } from '@dice-jar/browser';
import { Heading, Input, Stack } from '@/ui';
import type { CharacterData } from '@/model';

interface OtherThingsFieldProps {
  value: string;
  onSave: (data: Partial<CharacterData>) => Promise<void>;
}

export const OtherThingsField = ({ value, onSave }: OtherThingsFieldProps) => {
  const onSaveRef = useLatest(onSave);

  const [otherThings, setOtherThings] = useState<string>(() => value);
  const otherThingsPendingRef = useRef(false);

  const otherThingsSave = (next: Partial<CharacterData>) =>
    onSaveRef.current(next).finally(() => {
      otherThingsPendingRef.current = false;
    });
  const { onChange: otherThingsDebounced, flush: otherThingsFlush } = useDebouncedSave<Partial<CharacterData>>(otherThingsSave);

  useFirestoreSync(value, setOtherThings, otherThingsPendingRef);

  const handleOtherThingsChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const val = e.target.value;
      setOtherThings(val);
      otherThingsPendingRef.current = true;
      otherThingsDebounced({ inventoryOtherThings: val });
    },
    [otherThingsDebounced],
  );

  const handleOtherThingsBlur = useCallback(
    (e: React.FocusEvent<HTMLTextAreaElement>) => {
      otherThingsFlush({ inventoryOtherThings: e.target.value }).finally(() => {
        otherThingsPendingRef.current = false;
      });
    },
    [otherThingsFlush],
  );

  return (
    <Stack gap={2}>
      <Heading as="h4" size="sm">
        Other things *(animals, kits, stashed items, etc.)*
      </Heading>
      <Input
        multiline
        value={otherThings}
        placeholder="Notes…"
        aria-label="Other things"
        rows={3}
        onChange={handleOtherThingsChange}
        onBlur={handleOtherThingsBlur}
      />
    </Stack>
  );
};
