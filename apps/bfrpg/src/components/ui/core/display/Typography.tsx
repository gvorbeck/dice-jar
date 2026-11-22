import { forwardRef, createElement } from 'react';
import type { ReactNode, HTMLAttributes, ElementType } from 'react';
import { cn } from '@dice-jar/cn';
import './Typography.css';

type TypographyVariant =
  | 'h1'
  | 'h2'
  | 'h3'
  | 'h4'
  | 'h5'
  | 'h6'
  | 'sectionHeading'
  | 'baseSectionHeading'
  | 'infoHeading'
  | 'subHeading'
  | 'subHeadingSpaced'
  | 'subHeadingLime'
  | 'body'
  | 'bodySmall'
  | 'description'
  | 'descriptionCompact'
  | 'helper'
  | 'caption'
  | 'code';

type TypographyColor = 'primary' | 'secondary' | 'muted' | 'amber' | 'lime' | 'zinc' | 'slate' | 'red';

type TypographyWeight = 'normal' | 'medium' | 'semibold' | 'bold';

interface TypographyProps extends HTMLAttributes<HTMLElement> {
  children: ReactNode;
  variant?: TypographyVariant;
  color?: TypographyColor;
  weight?: TypographyWeight;
  as?: ElementType;
}

const Typography = forwardRef<HTMLElement, TypographyProps>(
  ({ children, variant = 'body', color, weight, as, className, ...props }, ref) => {
    // Auto-detect element based on variant if 'as' not provided
    const getDefaultElement = (variant: TypographyVariant): ElementType => {
      if (variant === 'caption' || variant === 'helper') return 'span';
      if (variant.startsWith('h') && /^h[1-6]$/.test(variant)) return variant as ElementType;
      if (variant.includes('Heading')) return 'h4';
      return 'p';
    };

    const Element = as || getDefaultElement(variant);

    // Auto-assign color based on variant if not explicitly provided
    const getDefaultColor = (variant: TypographyVariant): TypographyColor => {
      if (variant.includes('info')) return 'amber';
      if (variant.includes('Lime')) return 'lime';
      if (variant.includes('sub')) return 'amber';
      if (variant.includes('helper')) return 'secondary';
      if (variant.includes('Heading')) return 'primary';
      return 'primary';
    };

    const finalColor = color || getDefaultColor(variant);

    return createElement(
      Element,
      {
        ref,
        className: cn('typography', className),
        'data-variant': variant,
        'data-color': finalColor,
        'data-weight': weight,
        ...props,
      },
      children,
    );
  },
);

Typography.displayName = 'Typography';

export default Typography;
