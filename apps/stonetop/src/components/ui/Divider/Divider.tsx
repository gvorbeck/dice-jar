import { cn } from '@dice-jar/cn';
import './Divider.css';

export const Divider = ({ className }: { className?: string }) => <hr className={cn('divider', className)} />;
