import { Link } from 'wouter';
import { Button } from '@/components/ui';
import { Icon } from '@/components/ui/core/display';
import { Card } from '@/components/ui/core/display';
import type { ReactNode } from 'react';
import { DESIGN_TOKENS } from '@/constants';
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
    <Card variant="gradient" size="default" className="group relative min-w-0 w-full">
      {/* Clickable overlay for entire card */}
      <Link href={href} className="absolute inset-0 z-10 cursor-pointer rounded-xl" aria-label={`View ${name}`} />

      {/* Background decoration */}
      <div
        className={`absolute top-0 right-0 ${DESIGN_TOKENS.decorations.large} bg-gradient-to-bl from-amber-500/5 to-transparent rounded-xl pointer-events-none`}
      />
      <div
        className={`absolute bottom-0 left-0 ${DESIGN_TOKENS.decorations.medium} bg-gradient-to-tr from-amber-500/5 to-transparent rounded-xl pointer-events-none`}
      />

      <div className="relative z-20 space-y-4 pointer-events-none">
        {children}

        {/* Action Area */}
        {user && (
          <div className="flex justify-end gap-2 pt-2 sm:pt-3 border-t border-zinc-700/50">
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
              {isDeleting ? <div className="animate-spin rounded-full h-3 w-3 border-b border-current" /> : <Icon name="trash" size="xs" />}
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
}
