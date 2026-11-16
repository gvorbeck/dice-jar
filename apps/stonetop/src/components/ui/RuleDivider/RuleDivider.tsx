import { cn } from '@dice-jar/cn';

interface RuleDividerProps {
  className?: string;
}

export const RuleDivider = ({ className }: RuleDividerProps) => (
  <div className={cn('rule-divider', className)}>
    <span className="rule-divider-diamond" />
  </div>
);
