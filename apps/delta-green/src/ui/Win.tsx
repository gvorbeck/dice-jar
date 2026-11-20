import { useId, useState, type ReactNode, type Ref } from 'react';
import { cn } from '@dice-jar/cn';

// Apart from ui/index.tsx so pages that need no form controls don't pull in react-aria-components.
interface WinProps {
  title: string;
  className?: string;
  right?: ReactNode;
  children: ReactNode;
  headingRef?: Ref<HTMLHeadingElement>;
  collapsible?: boolean;
  sub?: boolean;
}

/** `collapsible`: the body starts hidden and the title toggles it. `sub`: an h3, for a window inside another. */
export const Win = ({ title, right, children, headingRef, className, collapsible, sub }: WinProps) => {
  const id = useId();
  const H = sub ? 'h3' : 'h2';
  const [open, setOpen] = useState(!collapsible);
  return (
    <section className={cn('win', className)} aria-labelledby={id}>
      <header>
        <H id={id} tabIndex={headingRef ? -1 : undefined} ref={headingRef}>
          {collapsible ? (
            <button className="win-toggle" aria-expanded={open} aria-controls={`${id}-b`} onClick={() => setOpen((o) => !o)}>
              {open ? '▾' : '▸'} {title}
            </button>
          ) : (
            title
          )}
        </H>
        <span>{right}</span>
      </header>
      <div className="body" id={`${id}-b`} hidden={!open}>
        {children}
      </div>
    </section>
  );
};
