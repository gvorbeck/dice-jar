import { type ComponentPropsWithoutRef } from 'react';
import { cn } from '@dice-jar/cn';
import { parseInlineMarkdown } from '@/lib/parseMarkdown';
import './Text.css';

interface TextProps extends ComponentPropsWithoutRef<'span'> {
  as?: 'p' | 'span' | 'li';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  color?: 'default' | 'muted' | 'tertiary' | 'accent';
  font?: 'sans' | 'serif';
  weight?: 'normal' | 'semibold' | 'bold';
  leading?: 'tight' | 'normal' | 'loose';
  italic?: boolean;
}

export const Text = ({
  as: Tag = 'p',
  size = 'sm',
  color = 'default',
  font = 'sans',
  weight = 'normal',
  italic = false,
  leading,
  className,
  children,
  ...props
}: TextProps) => {
  const cx = cn(
    'text-base',
    `text-${size}`,
    `text-${color}`,
    `text-${font}`,
    weight === 'semibold' && 'text-semibold',
    weight === 'bold' && 'text-bold',
    italic && 'text-italic',
    leading === 'tight' && 'text-leading-tight',
    leading === 'normal' && 'text-leading-normal',
    leading === 'loose' && 'text-leading-loose',
    className,
  );

  const content = typeof children === 'string' ? parseInlineMarkdown(children) : children;
  return (
    <Tag className={cx} {...props}>
      {content}
    </Tag>
  );
};
