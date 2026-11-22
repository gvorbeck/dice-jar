import type { ReactNode } from 'react';
import { Typography } from '@/components/ui/core/display';
import { cn } from '@dice-jar/cn';
import StatusDot from './StatusDot';
import './SkillDescriptionItem.css';

type SkillDescriptionItemVariant = 'simple' | 'decorated';
type SkillDescriptionItemColor = 'amber' | 'lime' | 'blue';
type SkillDescriptionItemSemantic = 'div' | 'dl';

interface SkillDescriptionItemProps {
  title: string;
  description: string | ReactNode;
  variant?: SkillDescriptionItemVariant;
  color?: SkillDescriptionItemColor;
  semantic?: SkillDescriptionItemSemantic;
  className?: string;
}

/**
 * Reusable component for displaying skill/ability descriptions
 * with consistent styling and typography
 *
 * @param variant - "simple" for basic styling, "decorated" for enhanced styling with bullet point
 * @param semantic - "div" for generic container, "dl" for description list semantics
 */
export default function SkillDescriptionItem({
  title,
  description,
  variant = 'simple',
  color = 'amber',
  semantic = 'div',
  className,
}: SkillDescriptionItemProps) {
  const containerClassName = cn('skill-item', className);
  const dotColor = color;

  if (variant === 'decorated') {
    if (semantic === 'dl') {
      return (
        <dl className={containerClassName} data-color={color}>
          <dt className="skill-item-head">
            <StatusDot color={dotColor} ariaLabel="Skill or description item" />
            <Typography variant="bodySmall" weight="semibold" className="skill-item-title">
              {title}
            </Typography>
          </dt>
          <dd className="skill-item-text">{description}</dd>
        </dl>
      );
    }

    return (
      <div className={containerClassName} data-color={color}>
        <div className="skill-item-head">
          <StatusDot color={dotColor} ariaLabel="Skill or description item" />
          <Typography variant="bodySmall" weight="semibold" className="skill-item-title">
            {title}
          </Typography>
        </div>
        <div className="skill-item-text">{description}</div>
      </div>
    );
  }

  // Simple variant (default)
  if (semantic === 'dl') {
    return (
      <dl className={containerClassName} data-color={color}>
        <dt>
          <Typography variant="body" weight="medium" className="skill-item-simple-title">
            {title}:
          </Typography>
        </dt>
        <dd>
          <Typography variant="body" className="skill-item-simple-text">
            {description}
          </Typography>
        </dd>
      </dl>
    );
  }

  return (
    <div className={containerClassName} data-color={color}>
      <Typography variant="body" weight="medium" className="skill-item-simple-title">
        {title}:
      </Typography>
      <Typography variant="body" className="skill-item-simple-text">
        {description}
      </Typography>
    </div>
  );
}
