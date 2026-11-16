import { useState, useCallback } from 'react';
import { cn } from '@dice-jar/cn';
import { Button, Heading, Icon, Text, Tooltip } from '@/components/ui';
import './PlaybookSection.css';

const DEFAULT_WARN_TEXT = 'This section has unresolved choices — select an option to complete it.';

interface PlaybookSectionProps {
  title: string;
  choose?: number;
  chooseNote?: string;
  warn?: boolean;
  warnText?: string;
  collapsible?: boolean;
  defaultOpen?: boolean;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  forceChildren?: boolean;
  overrideNote?: string;
  children?: React.ReactNode;
}

export const PlaybookSection = ({
  title,
  choose,
  chooseNote,
  warn,
  warnText = DEFAULT_WARN_TEXT,
  collapsible,
  defaultOpen = true,
  isCollapsed,
  onToggleCollapse,
  forceChildren,
  overrideNote,
  children,
}: PlaybookSectionProps) => {
  const isUncontrolled = collapsible && !onToggleCollapse;
  const [selfOpen, setSelfOpen] = useState(defaultOpen);

  const handleSelfToggle = useCallback(() => setSelfOpen((v) => !v), []);

  const collapsed = isUncontrolled ? !selfOpen : !!isCollapsed;
  const handleToggle = isUncontrolled ? handleSelfToggle : onToggleCollapse;

  const showCollapse = collapsible && !overrideNote;
  const chevronCx = cn('playbook-section-collapse-chevron', !collapsed && 'playbook-section-collapse-chevron-open');
  const collapseCx = cn('playbook-section-collapse-toggle', warn && 'playbook-section-collapse-toggle-hidden');
  const chooseCx = cn('playbook-section-section-title-choose', (!warn || !!overrideNote) && 'playbook-section-section-title-choose-hidden');
  const warnCx = cn('playbook-section-section-title-warn', (!warn || !!overrideNote) && 'playbook-section-section-title-warn-hidden');
  const sectionCx = cn('playbook-section-section', overrideNote && 'playbook-section-section-override');

  return (
    <section className={sectionCx}>
      <div className="playbook-section-section-header">
        <Heading as="h3" size="label" className="playbook-section-section-title">
          {title}
          {(choose !== undefined || chooseNote) && (
            <Text as="span" className={chooseCx}>
              {choose !== undefined ? `(Choose ${choose}${chooseNote ? `, ${chooseNote}` : ''})` : `(${chooseNote})`}
            </Text>
          )}
          <Tooltip text={warnText} side="top" plain noTabStop={!warn || !!overrideNote} className={warnCx}>
            <Icon name="warning" size="small" role="img" aria-label="Warning" aria-hidden={undefined} />
          </Tooltip>
        </Heading>
        {overrideNote && (
          <Text as="span" className="playbook-section-section-override-note">
            {overrideNote}
          </Text>
        )}
        {showCollapse && (
          <Button
            variant="ghost"
            size="sm"
            className={collapseCx}
            onClick={warn ? undefined : handleToggle}
            aria-expanded={!collapsed}
            aria-label={collapsed ? `Expand ${title}` : `Collapse ${title}`}
            tabIndex={warn ? -1 : undefined}
            aria-hidden={warn || undefined}
          >
            <Icon name="chevron-down" size="small" className={chevronCx} aria-hidden="true" />
          </Button>
        )}
      </div>
      {(!collapsed || forceChildren) && children}
    </section>
  );
};
