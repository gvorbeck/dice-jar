import { type ReactNode } from 'react';
import { cn } from '@dice-jar/cn';
import { parseInlineMarkdown } from '@/lib/parseMarkdown';
import './Heading.css';

interface HeadingProps {
  as?: 'h1' | 'h2' | 'h3' | 'h4';
  size?: 'xl' | 'lg' | 'md' | 'sm' | 'label';
  className?: string;
  id?: string;
  children: ReactNode;
}

export const Heading = ({ as: Tag = 'h2', size = 'lg', className, id, children }: HeadingProps) => {
  const cx = cn('heading-base', `heading-${size}`, className);
  const content = typeof children === 'string' ? parseInlineMarkdown(children) : children;

  return (
    <Tag id={id} className={cx}>
      {content}
    </Tag>
  );
};
