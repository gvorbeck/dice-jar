import { type ReactNode } from 'react';
import { Text } from '@/components/ui';

interface SiteBannerProps {
  children: ReactNode;
}

export const SiteBanner = ({ children }: SiteBannerProps) => (
  <div className="site-banner-banner" role="status" aria-live="polite">
    <Text size="xs">{children}</Text>
  </div>
);
