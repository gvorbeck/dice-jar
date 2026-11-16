import { useState, useId, type ReactNode } from 'react';
import { cn } from '@dice-jar/cn';
import { Icon } from '../Icon/Icon';

interface CollapseProps {
  label: string;
  defaultOpen?: boolean;
  children: ReactNode;
  className?: string;
  action?: ReactNode;
}

export const Collapse = ({ label, defaultOpen = false, children, className, action }: CollapseProps) => {
  const [open, setOpen] = useState(defaultOpen);
  const id = useId();
  const cx = cn('collapse', open && 'collapse-open', className);
  const handleToggle = () => setOpen((v) => !v);

  return (
    <div className={cx}>
      <div className="collapse-header">
        <button
          type="button"
          className="collapse-trigger field-focus-visible"
          onClick={handleToggle}
          aria-expanded={open}
          aria-controls={id}
        >
          <span className="grow">{label}</span>
          <Icon name="chevron-down" size="small" className="collapse-chevron" aria-hidden="true" />
        </button>
        {action && <div className="collapse-action">{action}</div>}
      </div>
      <div id={id} className="collapse-body" hidden={!open}>
        {children}
      </div>
    </div>
  );
};
