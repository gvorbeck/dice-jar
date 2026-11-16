import { useState, useId, useRef, useEffect, useCallback, useMemo, type ReactNode, type KeyboardEvent } from 'react';
import { cn } from '@dice-jar/cn';
import { Tooltip } from '../Tooltip/Tooltip';
import { Button } from '../Button/Button';
import { Icon } from '../Icon/Icon';
import './Tabs.css';

interface Tab {
  id?: string;
  label: string;
  content: ReactNode;
  badge?: ReactNode;
  badgeTooltip?: string;
  onRemove?: () => void;
  removeTooltip?: string;
}

interface TabsProps {
  tabs: Tab[];
  defaultIndex?: number;
  activeIndex?: number;
  onActiveChange?: (index: number) => void;
  className?: string;
  'aria-label': string;
  onAdd?: () => void;
}

export const tabBadgeClass = 'tabs-tab-badge';

const TabRemoveButton = ({ tab, onRemove }: { tab: Tab; onRemove: () => void }) => (
  <span className="tabs-tab-remove-wrapper">
    <Tooltip text={tab.removeTooltip ?? `Remove ${tab.label}`} side="bottom">
      <button type="button" className="tabs-tab-remove" aria-label={tab.removeTooltip ?? `Remove ${tab.label} tab`} onClick={onRemove}>
        <Icon name="close" aria-hidden size="small" />
      </button>
    </Tooltip>
  </span>
);

const AddTabButton = ({ onAdd }: { onAdd: () => void }) => (
  <span className="tabs-add-tab-wrapper">
    <Tooltip text="Add an Insert" side="bottom">
      <Button variant="ghost" size="sm" icon="plus" onClick={onAdd} aria-label="Add an insert" className="tabs-add-tab" />
    </Tooltip>
  </span>
);

const TabButton = ({
  tab,
  index,
  slotId,
  baseId,
  isActive,
  onActivate,
  onKeyDown,
  tabRefs,
  onRemove,
}: {
  tab: Tab;
  index: number;
  slotId: string;
  baseId: string;
  isActive: boolean;
  onActivate: (index: number) => void;
  onKeyDown: (e: KeyboardEvent<HTMLDivElement>, index: number) => void;
  tabRefs: React.MutableRefObject<(HTMLDivElement | null)[]>;
  onRemove?: () => void;
}) => {
  const collectTabNode = useCallback(
    (el: HTMLElement | null) => {
      // Collecting child DOM nodes into the parent's ref array is the standard
      // callback-ref pattern; `tabRefs` is owned by the parent Tabs and passed down
      // precisely as mutable collection storage. The Compiler can't see that intent
      // from here, so it flags the write — safe to allow.
      tabRefs.current[index] = el as HTMLDivElement | null;
    },
    [tabRefs, index],
  );
  const cx = cn('tabs-tab', isActive && 'tabs-active', onRemove && 'tabs-tab-has-remove');
  const slotCx = cn('tabs-tab-slot', isActive && 'tabs-tab-slot-active');

  const handleClick = useCallback(() => onActivate(index), [onActivate, index]);
  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLDivElement>) => {
      // role="tab" is not a native button, so activate on Enter/Space ourselves; arrow/Home/End
      // navigation is delegated to the parent handler.
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onActivate(index);
        return;
      }
      onKeyDown(e, index);
    },
    [onActivate, onKeyDown, index],
  );

  const tabEl = (
    <div
      ref={collectTabNode}
      role="tab"
      id={`${baseId}-tab-${slotId}`}
      aria-controls={`${baseId}-panel-${slotId}`}
      aria-selected={isActive}
      tabIndex={isActive ? 0 : -1}
      className={cx}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
    >
      {tab.label}
      {tab.badge}
    </div>
  );

  // The remove control is a real <button>; render it as a sibling of the
  // role="tab" element (which is itself interactive) rather than a child, so the
  // tab never contains an interactive descendant.
  return (
    <div className={slotCx}>
      {tab.badgeTooltip ? (
        <Tooltip text={tab.badgeTooltip} side="bottom">
          {tabEl}
        </Tooltip>
      ) : (
        tabEl
      )}
      {onRemove && <TabRemoveButton tab={tab} onRemove={onRemove} />}
    </div>
  );
};

export const Tabs = ({ tabs, defaultIndex = 0, activeIndex, onActiveChange, className, 'aria-label': ariaLabel, onAdd }: TabsProps) => {
  const [internalActive, setInternalActive] = useState(defaultIndex);
  const active = activeIndex ?? internalActive;

  const baseId = useId();
  const tabRefs = useRef<(HTMLDivElement | null)[]>([]);
  const tablistRef = useRef<HTMLDivElement>(null);

  const resolvedTabs = useMemo(
    () =>
      tabs.map((tab, i) => ({
        ...tab,
        id: (tab.id ?? `${baseId}-slot-${i}`).replace(/[^\w-]/g, '-'),
      })),
    [tabs, baseId],
  );

  // Track which panels have ever been active by resolved id, not index: panels
  // render keyed by id, and dynamic insert tabs shift indices out from under a
  // Set<number>, which would mis-mount panels.
  const [everActiveIds, setEverActiveIds] = useState<Set<string>>(
    () => new Set([resolvedTabs[active]?.id].filter((id): id is string => id !== undefined)),
  );
  const setActive = useCallback(
    (i: number) => {
      setInternalActive(i);
      const id = resolvedTabs[i]?.id;
      if (id !== undefined) {
        setEverActiveIds((prev) => (prev.has(id) ? prev : new Set([...prev, id])));
      }
      onActiveChange?.(i);
    },
    [onActiveChange, resolvedTabs],
  );

  // Record the active panel's id as "ever active" during render rather than in an
  // effect. This is React's sanctioned adjust-state-while-rendering pattern (no
  // post-paint cascade), and it also covers a controlled `active` prop changing
  // externally — a case the setActive click handler above wouldn't see.
  const activeId = resolvedTabs[active]?.id;
  if (activeId !== undefined && !everActiveIds.has(activeId)) {
    setEverActiveIds((prev) => (prev.has(activeId) ? prev : new Set([...prev, activeId])));
  }

  const cx = cn('tabs', className);

  // Keep the active tab within the scrolled strip. Clicking and keyboard focus
  // scroll it into view on their own, but a controlled `activeIndex` change
  // (hash routing) touches neither, so a deep link can land on a tab that is
  // scrolled off screen. Measured off rects, not offsetLeft: the tab's
  // offsetParent is its position:relative slot, not the strip.
  useEffect(() => {
    const strip = tablistRef.current;
    const el = tabRefs.current[active];
    if (!strip || !el) return;
    const stripRect = strip.getBoundingClientRect();
    const elRect = el.getBoundingClientRect();
    if (elRect.left < stripRect.left) {
      strip.scrollLeft -= stripRect.left - elRect.left;
    } else if (elRect.right > stripRect.right) {
      strip.scrollLeft += elRect.right - stripRect.right;
    }
  }, [active]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLDivElement>, i: number) => {
      if (e.key === 'ArrowRight') {
        const next = (i + 1) % tabs.length;
        setActive(next);
        tabRefs.current[next]?.focus();
      } else if (e.key === 'ArrowLeft') {
        const prev = (i - 1 + tabs.length) % tabs.length;
        setActive(prev);
        tabRefs.current[prev]?.focus();
      } else if (e.key === 'Home') {
        e.preventDefault();
        setActive(0);
        tabRefs.current[0]?.focus();
      } else if (e.key === 'End') {
        e.preventDefault();
        const last = tabs.length - 1;
        setActive(last);
        tabRefs.current[last]?.focus();
      }
    },
    [tabs.length, setActive],
  );

  return (
    <div className={cx}>
      <div className="tabs-tablist-row">
        <div ref={tablistRef} className="tabs-tablist" role="tablist" aria-label={ariaLabel}>
          {resolvedTabs.map((tab, i) => (
            <TabButton
              key={tab.id}
              tab={tab}
              index={i}
              slotId={tab.id}
              baseId={baseId}
              isActive={active === i}
              onActivate={setActive}
              onKeyDown={handleKeyDown}
              tabRefs={tabRefs}
              onRemove={tab.onRemove}
            />
          ))}
        </div>
        {onAdd && <AddTabButton onAdd={onAdd} />}
      </div>
      {resolvedTabs.map((tab, i) => (
        <div
          key={tab.id}
          role="tabpanel"
          id={`${baseId}-panel-${tab.id}`}
          aria-labelledby={`${baseId}-tab-${tab.id}`}
          hidden={active !== i}
          className="tabs-panel"
        >
          {everActiveIds.has(tab.id) ? tab.content : null}
        </div>
      ))}
    </div>
  );
};
