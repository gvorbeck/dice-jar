import { cn } from '@/lib/cn';
import styles from './Divider.module.css';

export const Divider = ({ className }: { className?: string }) => <hr className={cn(styles.root, className)} />;
