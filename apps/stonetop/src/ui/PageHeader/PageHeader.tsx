import { useState, useRef, useEffect, useCallback, useId } from 'react';
import { Link } from 'react-router-dom';
import { useCopy } from '@dice-jar/browser';
import { Button, Heading, Input, Text, RuleDivider, Tooltip } from '@/ui';
import { useToast } from '@/ui/Toast/ToastContext';
import { PageNav } from './PageNav';
import { ThemeToggle } from './ThemeToggle';
import type { GameNav } from './gameNav';
import { SiteBanner } from '@/ui/SiteBanner/SiteBanner';
import { SITE_BANNER } from '@/lib/siteBanner';

/*
 * PageHeader — the semantic <header> landmark at the top of every page.
 * It contains up to three visual layers, rendered top to bottom:
 *
 *   1. SiteBanner — a site-wide notification strip (e.g. "Under Construction").
 *                   Optional — only rendered when there is something to say.
 *                   Always shown regardless of simple mode, because it carries
 *                   important information every visitor needs to see.
 *
 *   2. TopBar     — the "Hearthfire" wordmark strip. Identifies the app on
 *                   every full page. Not shown in simple mode (Home, NotFound)
 *                   where the page has its own hero treatment.
 *
 *   3. Page identity — page switcher, page title (optionally inline-editable),
 *                   optional subtitle, game ID with copy button, and a decorative
 *                   rule divider. Only shown in full mode.
 *
 * Props come in two shapes (TypeScript discriminated union):
 *
 *   simple={true}  — Home and NotFound. Renders SiteBanner only.
 *                    No wordmark, no switcher, no title, no game ID.
 *
 *   simple={false} (default) — All inner pages. Renders all three layers.
 *                    Title is read-only unless onSaveTitle + titleLabel are
 *                    provided, in which case an inline edit button appears.
 */

type SimpleProps = {
  simple: true;
};

type FullProps = {
  simple?: false;
  title: string;
  subtitle?: string;
  icon?: React.ReactElement<SVGSVGElement>;
  gameId: string;
  nav?: GameNav;
  // Page-specific controls rendered alongside the game ID. A slot rather than a
  // flag so PageHeader stays generic: only the page that owns a control passes
  // one, and no gating is needed to keep it off the pages that don't.
  actions?: React.ReactNode;
} & ({ onSaveTitle: (value: string) => Promise<void>; titleLabel: string } | { onSaveTitle?: never; titleLabel?: never });

type Props = SimpleProps | FullProps;

export const PageHeader = (props: Props) => {
  const { simple } = props;

  /*
   * All the editing/copy state below is only used in full mode.
   * Hooks must always be called unconditionally in React, so we declare
   * them here even though simple mode never touches them.
   */
  const { addToast } = useToast();
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState('');
  const [copyState, copy] = useCopy();
  const copied = copyState === 'ok';
  const inputRef = useRef<HTMLInputElement>(null);
  const editBtnRef = useRef<HTMLButtonElement>(null);
  // Set just before a keyboard-driven commit/cancel so the focus-return in `commit` only fires
  // for Enter, not for a blur caused by clicking or tabbing to another element — otherwise we'd
  // steal focus from wherever the user was headed.
  const committingViaKeyboardRef = useRef(false);
  const navDropdownId = useId();

  useEffect(() => {
    if (editing) {
      inputRef.current?.select();
    } else if (committingViaKeyboardRef.current) {
      committingViaKeyboardRef.current = false;
      editBtnRef.current?.focus();
    }
  }, [editing]);

  useEffect(() => {
    if (copyState === 'fail') addToast('Failed to copy game ID.', 'error');
  }, [copyState, addToast]);

  const startEditing = useCallback(() => {
    if (simple) return;
    setValue((props as FullProps).title);
    setEditing(true);
  }, [simple, props]);

  const commit = useCallback(async () => {
    if (simple) return;
    const fullProps = props as FullProps;
    const trimmed = value.trim();
    try {
      if (trimmed && trimmed !== fullProps.title) await fullProps.onSaveTitle?.(trimmed);
    } catch {
      addToast('Failed to save game name. Try again.', 'error');
    } finally {
      setEditing(false);
    }
  }, [simple, props, value, addToast]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => setValue(e.target.value), []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        committingViaKeyboardRef.current = true;
        commit();
      }
      if (e.key === 'Escape') {
        committingViaKeyboardRef.current = true;
        setEditing(false);
      }
    },
    [commit],
  );

  const copyGameId = () => {
    if (!simple) copy((props as FullProps).gameId);
  };

  const copyLabel = copied ? 'Copied!' : 'Copy game ID';

  /*
   * Page identity block — only built in full mode, kept as a variable
   * so the JSX below stays readable without an IIFE.
   */
  let pageIdentity: React.ReactNode = null;
  if (!simple) {
    const { title, subtitle, icon, gameId, nav, actions } = props as FullProps;
    const onSaveTitle = (props as FullProps).onSaveTitle;
    const titleLabel = (props as FullProps).titleLabel;

    pageIdentity = (
      <div className="page-header-body">
        {nav && (
          <div className="page-header-nav-row">
            <PageNav nav={nav} dropdownId={navDropdownId} />
          </div>
        )}
        <div className="row gap-3">
          {icon && (
            <span className="page-header-title-icon" aria-hidden="true">
              {icon}
            </span>
          )}
          {onSaveTitle && editing ? (
            <Input
              ref={inputRef as React.Ref<HTMLInputElement>}
              className="page-header-title-input field-focus-visible"
              value={value}
              onChange={handleChange}
              onBlur={commit}
              onKeyDown={handleKeyDown}
              aria-label={titleLabel}
            />
          ) : (
            <>
              <Heading as="h2" size="xl">
                {title}
              </Heading>
              {onSaveTitle && (
                <Tooltip text="Edit name" side="top">
                  <Button
                    ref={editBtnRef}
                    variant="ghost"
                    icon="pencil"
                    size="sm"
                    className="page-header-edit-btn field-focus-visible"
                    onClick={startEditing}
                    aria-label={titleLabel!}
                  />
                </Tooltip>
              )}
            </>
          )}
        </div>
        {subtitle && (
          <Text color="muted" size="xs" className="mt-1">
            {subtitle}
          </Text>
        )}
        <div className="page-header-game-id">
          <Text color="muted" size="xs">
            Game ID:{' '}
            <Text as="span" color="accent" size="xs">
              {gameId}
            </Text>
          </Text>
          <Tooltip text={copyLabel} side="top">
            <Button
              variant="ghost"
              icon={copied ? 'check' : 'copy'}
              size="sm"
              className="page-header-copy-btn field-focus-visible"
              onClick={copyGameId}
              aria-label={copyLabel}
            />
          </Tooltip>
          {actions && <div className="page-header-actions">{actions}</div>}
        </div>
        <RuleDivider className="mt-6" />
      </div>
    );
  }

  return (
    /*
     * <header> is the correct semantic landmark here — it wraps the entire
     * top-of-page identity block, not just the wordmark strip.
     */
    <header className="page-header">
      {SITE_BANNER && <SiteBanner>{SITE_BANNER}</SiteBanner>}

      {/*
       * TopBar — the "Hearthfire" wordmark strip.
       * Only shown in full mode. Simple pages (Home, NotFound) have their
       * own hero treatment and don't need the wordmark here.
       */}
      {!simple && (
        <div className="page-header-top-bar">
          <Heading as="h1" size="md" className="page-header-wordmark">
            <Link to="/" className="page-header-wordmark-link field-focus-visible">
              Hearthfire
            </Link>
          </Heading>
          <ThemeToggle />
        </div>
      )}

      {/*
       * Page identity — page switcher, title, game ID, rule divider.
       * Only rendered in full mode.
       */}
      {pageIdentity}
    </header>
  );
};
