import type { ReactNode } from 'react';
import { cn } from '@dice-jar/cn';
import { Typography } from '@/components/ui/core/display';
import './HeroSection.css';

interface HeroSectionProps {
  title: string;
  subtitle?: string;
  logo?: ReactNode;
  children?: ReactNode;
  className?: string;
}

export function HeroSection({ title, subtitle, logo, children, className }: HeroSectionProps) {
  return (
    <div className={cn('hero', className)}>
      <header className="hero-body">
        {logo && <div className="hero-logo">{logo}</div>}

        <div className="hero-title">
          <Typography variant="h1">{title}</Typography>
          <div className="hero-rule" />
        </div>

        {subtitle && (
          <Typography variant="body" color="secondary" className="hero-subtitle">
            {subtitle}
          </Typography>
        )}

        {children}
      </header>
    </div>
  );
}
