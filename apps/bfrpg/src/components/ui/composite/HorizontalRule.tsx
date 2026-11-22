import { memo } from 'react';
import { cn } from '@dice-jar/cn';
import './HorizontalRule.css';

interface HorizontalRuleProps {
  className?: string;
}

function HorizontalRuleComponent({ className }: HorizontalRuleProps) {
  return <div className={cn('hr', className)} />;
}

const HorizontalRule = memo(HorizontalRuleComponent);
export default HorizontalRule;
