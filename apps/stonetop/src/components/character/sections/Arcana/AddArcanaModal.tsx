import { useState, useId, useMemo, useCallback } from 'react';
import { ListBox, ListBoxItem, type Key } from 'react-aria-components';
import { cn } from '@dice-jar/cn';
import { Modal, Heading, Button, Input, Text } from '@/components/ui';

interface ArcanaItem {
  id: string;
  name: string;
  tags?: string;
}

interface AddArcanaModalProps<T extends ArcanaItem> {
  open: boolean;
  onClose: () => void;
  onAdd: (item: T) => void;
  items: T[];
  existingIds: string[];
  title: string;
  noun: string;
  placeholder: string;
}

export const AddArcanaModal = <T extends ArcanaItem>({
  open,
  onClose,
  onAdd,
  items,
  existingIds,
  title,
  noun,
  placeholder,
}: AddArcanaModalProps<T>) => {
  const headingId = useId();
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<T | null>(null);

  const existing = useMemo(() => new Set(existingIds), [existingIds]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((a) => !existing.has(a.id) && (q === '' || a.name.toLowerCase().includes(q)));
  }, [query, existing, items]);

  const handleAdd = useCallback(() => {
    if (!selected) return;
    onAdd(selected);
    setQuery('');
    setSelected(null);
  }, [selected, onAdd]);

  const handleClose = useCallback(() => {
    setQuery('');
    setSelected(null);
    onClose();
  }, [onClose]);

  const handleQueryChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    setSelected(null);
  }, []);

  const handleSelectionChange = useCallback(
    (keys: 'all' | Set<Key>) => {
      const id = keys === 'all' ? undefined : [...keys][0];
      setSelected(results.find((a) => a.id === id) ?? null);
    },
    [results],
  );

  // Enter or double-click on an option adds it straight away.
  const handleAction = useCallback(
    (key: Key) => {
      const item = results.find((a) => a.id === key);
      if (!item) return;
      onAdd(item);
      setQuery('');
      setSelected(null);
    },
    [results, onAdd],
  );

  const listCx = cn('add-arcana-modal-list', results.length === 0 && 'add-arcana-modal-list-empty');
  const allAdded = existing.size === items.length;

  return (
    <Modal open={open} onClose={handleClose} aria-labelledby={headingId} className="add-arcana-modal-modal">
      <Heading as="h2" size="md" id={headingId}>
        {title}
      </Heading>

      <Input label="Search" type="search" placeholder={placeholder} value={query} onChange={handleQueryChange} autoComplete="off" />

      <ListBox
        aria-label={title}
        items={results}
        selectionMode="single"
        selectionBehavior="replace"
        disallowEmptySelection={false}
        selectedKeys={selected ? [selected.id] : []}
        onSelectionChange={handleSelectionChange}
        onAction={handleAction}
        className={listCx}
        renderEmptyState={() => (
          <Text color="muted" className="add-arcana-modal-empty">
            {allAdded ? `All ${noun} have been added.` : 'No matches found.'}
          </Text>
        )}
      >
        {(a) => (
          <ListBoxItem id={a.id} textValue={a.name} className="add-arcana-modal-item">
            <Text as="span" font="serif" size="sm">
              {a.name}
            </Text>
            {a.tags && (
              <Text as="span" font="serif" size="xs" italic color="muted">
                {a.tags}
              </Text>
            )}
          </ListBoxItem>
        )}
      </ListBox>

      <div className="add-arcana-modal-actions">
        <Button variant="secondary" onClick={handleClose}>
          Cancel
        </Button>
        <Button variant="primary" onClick={handleAdd} disabled={!selected}>
          Add
        </Button>
      </div>
    </Modal>
  );
};
