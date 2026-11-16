import { useCallback } from 'react';
import { cn } from '@dice-jar/cn';
import { Button, Text, Tooltip } from '@/components/ui';
import type { SteadingNPC, NpcRelationship } from '@/types';

interface NpcRowProps {
  npc: SteadingNPC;
  onEdit: (npc: SteadingNPC) => void;
  onRemove: (id: string) => void;
  onToggleDead: (id: string) => void;
  resolveTarget: (rel: NpcRelationship) => string;
}

export const NpcRow = ({ npc, onEdit, onRemove, onToggleDead, resolveTarget }: NpcRowProps) => {
  const handleEdit = useCallback(() => onEdit(npc), [onEdit, npc]);
  const handleRemove = useCallback(() => onRemove(npc.id), [onRemove, npc.id]);
  const handleToggleDead = useCallback(() => onToggleDead(npc.id), [onToggleDead, npc.id]);
  const rowCx = cn('npc-row-npc-row', npc.dead && 'npc-row-npc-row-dead');
  const nameCx = cn(npc.dead && 'npc-row-npc-name-strike');
  const tombstoneCx = cn(npc.dead && 'npc-row-tombstone-active');
  return (
    <div className={rowCx} role="listitem">
      <div className="npc-row-npc-info">
        <Text as="span" className="npc-row-npc-name">
          <span className={nameCx}>{npc.name}</span>
          {npc.dead && (
            <Text as="span" className="npc-row-npc-dead-label">
              (DEAD)
            </Text>
          )}
          {npc.pronouns && <span className="npc-row-npc-pronouns">{npc.pronouns}</span>}
        </Text>
        {npc.occupation && (
          <Text as="span" size="xs" color="muted" italic>
            {npc.occupation}
          </Text>
        )}
        {npc.traits && npc.traits.length > 0 && (
          <div className="npc-row-npc-traits">
            {npc.traits.map((t) => (
              <span key={t} className="npc-row-npc-trait npc-row-npc-pill">
                {t}
              </span>
            ))}
          </div>
        )}
        {npc.relationships && npc.relationships.length > 0 && (
          <div className="npc-row-npc-rel-traits">
            {npc.relationships.map((rel) => {
              const label = [rel.type, rel.targetId ? resolveTarget(rel) : ''].filter(Boolean).join(': ');
              return label ? (
                <span key={rel.id} className="npc-row-npc-rel-trait npc-row-npc-pill">
                  {label}
                </span>
              ) : null;
            })}
          </div>
        )}
        {npc.notes && (
          <Text as="span" size="xs" color="muted">
            {npc.notes}
          </Text>
        )}
      </div>
      <div className="npc-row-npc-actions">
        <Button variant="ghost" size="sm" onClick={handleEdit} aria-label={`Edit ${npc.name}`}>
          Edit
        </Button>
        <Tooltip text={npc.dead ? 'Mark as alive' : 'Mark as dead'}>
          <Button
            variant="ghost"
            size="sm"
            icon="tombstone"
            onClick={handleToggleDead}
            aria-label={npc.dead ? `Mark ${npc.name} as alive` : `Mark ${npc.name} as dead`}
            className={tombstoneCx}
          />
        </Tooltip>
        <Tooltip text="Remove NPC">
          <Button variant="ghost" size="sm" icon="trash" onClick={handleRemove} aria-label={`Remove ${npc.name}`} />
        </Tooltip>
      </div>
    </div>
  );
};
