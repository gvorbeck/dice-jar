import { cn } from '@/lib/cn';
import styles from './RuleDivider.module.css';

interface RuleDividerProps {
  className?: string;
}

export const RuleDivider = ({ className }: RuleDividerProps) => (
  <div className={cn(styles.root, className)}>
    <span className={styles.diamond} />
  </div>
);
