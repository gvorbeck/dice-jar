import { type ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { parseInlineMarkdown } from '@/lib/parseMarkdown';
import styles from './Heading.module.css';

interface HeadingProps {
  as?: 'h1' | 'h2' | 'h3' | 'h4';
  size?: 'xl' | 'lg' | 'md' | 'sm' | 'label';
  className?: string;
  id?: string;
  children: ReactNode;
}

export const Heading = ({ as: Tag = 'h2', size = 'lg', className, id, children }: HeadingProps) => {
  const cx = cn(styles.base, styles[size], className);
  const content = typeof children === 'string' ? parseInlineMarkdown(children) : children;

  return (
    <Tag id={id} className={cx}>
      {content}
    </Tag>
  );
};
