import { cn } from '@dice-jar/cn';
import type { ReactNode } from 'react';

interface PlaybookColumnsProps {
  left?: ReactNode;
  right?: ReactNode;
  full?: ReactNode;
  className?: string;
}

export const PlaybookColumns = ({ left, right, full, className }: PlaybookColumnsProps) => {
  if (full !== undefined) {
    const cx = cn('w-full', className);
    return <div className={cx}>{full}</div>;
  }
  const cx = cn('playbook-columns', className);
  return (
    <div className={cx}>
      {left !== undefined && <div className="playbook-columns-col">{left}</div>}
      {right !== undefined && <div className="playbook-columns-col">{right}</div>}
    </div>
  );
};
