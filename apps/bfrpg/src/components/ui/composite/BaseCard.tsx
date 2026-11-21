import { Link } from 'wouter';
import { Button } from '@/components/ui';
import { Icon } from '@/components/ui/core/display';
import { Card } from '@/components/ui/core/display';
import type { ReactNode } from 'react';
import './BaseCard.css';

interface BaseCardProps {
  id: string;
  name: string;
  user: { uid: string } | null;
  href: string;
  onDelete: (id: string, name: string) => void;
  onCopy: (url: string, name: string) => void;
  isDeleting: boolean;
  children: ReactNode;
}

export function BaseCard({ id, name, user, href, onDelete, onCopy, isDeleting, children }: BaseCardProps) {
  return (
    <Card variant="gradient" size="default" className="base-card">
      {/* Clickable overlay for entire card */}
      <Link href={href} className="base-card-link" aria-label={`View ${name}`} />

      {/* Background decoration */}
      <div className="base-card-glow" data-corner="top-right" />
      <div className="base-card-glow" data-corner="bottom-left" />

      <div className="base-card-body">
        {children}

        {/* Action Area */}
        {user && (
          <div className="base-card-actions">
            <Button
              variant="secondary"
              size="sm"
              className="card-action"
              onClick={() => {
                const fullUrl = `${window.location.origin}${href}`;
                onCopy(fullUrl, name);
              }}
              icon="copy"
              iconSize="xs"
              aria-label={`Copy character sheet URL for ${name}`}
              title={`Copy character sheet URL for ${name}`}
            />
            <Button
              variant="secondary"
              size="sm"
              className="card-action card-action-danger"
              onClick={() => {
                onDelete(id, name);
              }}
              disabled={isDeleting}
              aria-label={`Delete ${name}`}
              title={`Delete ${name}`}
            >
              {isDeleting ? <div className="base-card-spinner" /> : <Icon name="trash" size="xs" />}
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
}
