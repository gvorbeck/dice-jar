import { useEffect } from 'react';
import { Modal } from '@/components/modals';
import { Typography } from '@/components/ui/core/display';
import { SectionWrapper } from '@/components/ui/core/layout';
import { useCombatLogic } from '@/hooks';
import { sortCombatantsByInitiative } from '@/utils';
import CombatControls from '../combat/CombatControls';
import InitiativeTable from '../combat/InitiativeTable';
import PreCombatInitiativeSection from '../combat/PreCombatInitiativeSection';
import CombatantsList from '../combat/CombatantsList';
import type { Game } from '@/types';
import './GameModals.css';

interface CombatTrackerModalProps {
  isOpen: boolean;
  onClose: () => void;
  game?: Game;
  onUpdateGame?: (updatedGame: Game) => void;
}

export default function CombatTrackerModal({ isOpen, onClose, game, onUpdateGame }: CombatTrackerModalProps) {
  // All combat logic is now handled by the custom hook
  const {
    combatants,
    currentTurn,
    round,
    isCombatActive,
    currentCombatant,
    allCombatantsHaveInitiative,
    availablePlayers,
    currentCombatants,
    currentCombatantsWithInitiative,
    addPlayerToCombat,
    removeCombatant,
    initializeCombat,
    rollInitiativeForMonsters,
    updatePreCombatInitiative,
    updateMultiplePreCombatInitiatives,
    updateInitiative,
    updateCombatantHp,
    setCurrentTurn,
    nextTurn,
    endCombat,
  } = useCombatLogic(game, onUpdateGame);

  // Keyboard shortcuts for common combat actions
  useEffect(() => {
    if (!isOpen || !isCombatActive) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      // Keys typed or pressed in a field or button belong to it: E types an "e", Space presses the button, arrows move the cursor
      if ((event.target as Element | null)?.closest('input, textarea, select, button, a, [contenteditable]')) return;
      // Use Space and Arrow keys instead of Cmd/Ctrl shortcuts to avoid browser conflicts
      if (!event.ctrlKey && !event.metaKey && !event.altKey) {
        switch (event.key.toLowerCase()) {
          case ' ': // Spacebar for next turn
            event.preventDefault();
            if (allCombatantsHaveInitiative) {
              nextTurn();
            }
            break;
          case 'e': // E key for end combat
            event.preventDefault();
            endCombat();
            break;
          case 'arrowright': // Right arrow for next turn (alternative)
            event.preventDefault();
            if (allCombatantsHaveInitiative) {
              nextTurn();
            }
            break;
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isCombatActive, allCombatantsHaveInitiative, nextTurn, endCombat]);

  if (!game) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="Combat Tracker" size="lg">
        <div className="game-modal-empty">
          <Typography variant="body" color="muted">
            No game data available for combat tracking.
          </Typography>
        </div>
      </Modal>
    );
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Combat Tracker - ${game.name}`} size="lg">
      <div className="game-modal">
        {/* Combat Controls */}
        <CombatControls
          isCombatActive={isCombatActive}
          currentCombatantsCount={currentCombatants.length}
          currentCombatant={currentCombatant ? { name: currentCombatant.name } : undefined}
          round={round}
          allCombatantsHaveInitiative={allCombatantsHaveInitiative}
          onStartCombat={initializeCombat}
          onNextTurn={nextTurn}
          onEndCombat={endCombat}
        />

        {/* Loading State */}

        {/* No Combatants */}
        {currentCombatants.length === 0 && (
          <div className="game-modal-empty" role="status">
            <Typography variant="body" color="secondary">
              No combatants available for combat.
            </Typography>
            <Typography variant="bodySmall" color="muted">
              Add monsters from the Bestiary or players from below to begin combat.
            </Typography>
          </div>
        )}

        {/* Initiative Order with Table */}
        {combatants.length > 0 && (
          <SectionWrapper title="Initiative Order">
            <div className="game-modal-pad">
              <InitiativeTable
                combatants={sortCombatantsByInitiative(combatants)}
                currentTurn={currentTurn}
                isCombatActive={isCombatActive}
                onUpdateInitiative={updateInitiative}
                onSetCurrentTurn={setCurrentTurn}
                onUpdateHp={updateCombatantHp}
                onRollInitiativeForMonsters={rollInitiativeForMonsters}
              />
            </div>
          </SectionWrapper>
        )}

        {/* Pre-Combat Initiative Setting */}
        {!isCombatActive && currentCombatants.length > 0 && combatants.length === 0 && (
          <PreCombatInitiativeSection
            combatants={currentCombatantsWithInitiative}
            onUpdateInitiative={updatePreCombatInitiative}
            onUpdateMultipleInitiatives={updateMultiplePreCombatInitiatives}
            onDeleteCombatant={(combatant) => {
              // Find the actual index in currentCombatants based on the combatant from the sorted list
              const actualIndex = currentCombatants.findIndex((c) => c.name === combatant.name);
              if (actualIndex !== -1) {
                removeCombatant(actualIndex);
              }
            }}
          />
        )}

        {/* Available Players (before combat starts) */}
        {!isCombatActive && availablePlayers.length > 0 && (
          <CombatantsList
            title="Available Players"
            combatants={availablePlayers}
            variant="available"
            onAction={(action, index) => {
              if (action === 'add') {
                const playerToAdd = availablePlayers[index];
                if (playerToAdd) {
                  addPlayerToCombat(playerToAdd);
                }
              }
            }}
          />
        )}
      </div>
    </Modal>
  );
}

// Export the error fallback component for external error boundary usage
