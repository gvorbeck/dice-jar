import { type ReactNode } from 'react';
import { Text } from '@/components/ui';
import './SiteBanner.css';

interface SiteBannerProps {
  children: ReactNode;
}

export const SiteBanner = ({ children }: SiteBannerProps) => (
  <div className="site-banner-banner" role="status" aria-live="polite">
    <Text size="xs">{children}</Text>
  </div>
);
