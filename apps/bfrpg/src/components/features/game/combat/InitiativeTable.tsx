import { Table } from '@/components/ui/composite';
import { Typography, Badge, Image } from '@/components/ui/core/display';
import { NumberInput, Button } from '@/components/ui/core/primitives';
import type { TableColumn } from '@/components/ui/composite';
import type { CombatantWithInitiative } from '@/types';
import './Combat.css';

interface InitiativeTableProps {
  combatants: CombatantWithInitiative[];
  currentTurn: number;
  isCombatActive: boolean;
  loading?: boolean;
  onUpdateInitiative: (combatant: CombatantWithInitiative, newInitiative: number) => void;
  onSetCurrentTurn: (index: number) => void;
  onUpdateHp?: (combatant: CombatantWithInitiative, newHp: number) => void;
  onDeleteCombatant?: (combatant: CombatantWithInitiative, index: number) => void;
  onRollInitiativeForMonsters?: () => void;
  showHp?: boolean;
}

// Helper: Render combatant name cell
function renderCombatantNameCell(combatant: CombatantWithInitiative, isCurrentTurn: boolean) {
  return (
    <div className="initiative-name" data-current={isCurrentTurn || undefined}>
      {combatant.avatar && typeof combatant.avatar === 'string' && (
        <Image variant="avatar" size="xs" src={combatant.avatar} alt={`${combatant.name} avatar`} />
      )}
      <div>
        <Typography variant="bodySmall" color="zinc" title={combatant.name}>
          {combatant.name}
        </Typography>
        <div className="initiative-meta">
          <Typography variant="caption" color="secondary">
            AC {combatant.ac}
          </Typography>
          {combatant.isPlayer && (
            <Badge variant="secondary" size="sm">
              PLAYER
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
}

// Helper: Create name column
function createNameColumn(combatants: CombatantWithInitiative[], currentTurn: number, isCombatActive: boolean): TableColumn {
  return {
    key: 'name',
    header: 'Combatant',
    cell: (combatant: Record<string, unknown>) => {
      const c = combatant as CombatantWithInitiative;
      const index = combatants.findIndex((cb) => cb.name === c.name && cb.initiative === c.initiative);
      const isCurrentTurn = isCombatActive && index === currentTurn;
      return renderCombatantNameCell(c, isCurrentTurn);
    },
    sortable: false,
    width: '40%',
  };
}

// Helper: Create initiative column
function createInitiativeColumn(onUpdateInitiative: (combatant: CombatantWithInitiative, newInitiative: number) => void): TableColumn {
  return {
    key: 'initiative',
    header: 'Initiative ↓',
    cell: (combatant: Record<string, unknown>) => {
      const c = combatant as CombatantWithInitiative;
      return (
        <NumberInput
          value={c.initiative || 0}
          onChange={(value) => {
            if (value !== undefined) {
              onUpdateInitiative(c, value);
            }
          }}
          minValue={1}
          maxValue={c.isPlayer ? 6 : 10}
          aria-label={`Initiative for ${c.name}`}
          className="initiative-input"
        />
      );
    },
    sortable: false,
    align: 'center' as const,
    width: '35%',
  };
}

// Helper: Create HP column
function createHpColumn(
  onUpdateHp: ((combatant: CombatantWithInitiative, newHp: number) => void) | undefined,
  hasDeleteColumn: boolean,
): TableColumn {
  return {
    key: 'hp',
    header: 'HP',
    cell: (combatant: Record<string, unknown>) => {
      const c = combatant as CombatantWithInitiative;
      const { current: currentHp, max: maxHp } = c.hp;

      return (
        <div className="initiative-hp">
          <NumberInput
            value={currentHp}
            onChange={(value) => {
              if (onUpdateHp && value !== undefined) {
                onUpdateHp(c, value);
              }
            }}
            minValue={0}
            maxValue={maxHp}
            aria-label={`Current HP for ${c.name}`}
            className="initiative-hp-input"
          />
        </div>
      );
    },
    align: 'center' as const,
    width: hasDeleteColumn ? '20%' : '25%',
  };
}

// Helper: Create delete column
function createDeleteColumn(
  combatants: CombatantWithInitiative[],
  onDeleteCombatant: (combatant: CombatantWithInitiative, index: number) => void,
): TableColumn {
  return {
    key: 'actions',
    header: '',
    cell: (combatant: Record<string, unknown>) => {
      const c = combatant as CombatantWithInitiative;
      const index = combatants.findIndex((cb) => cb.name === c.name && cb.initiative === c.initiative);

      return (
        <Button
          onClick={() => {
            onDeleteCombatant(c, index);
          }}
          variant="destructive"
          size="sm"
          className="initiative-delete"
          icon="trash"
          iconSize="sm"
          aria-label={`Remove ${c.name} from combat`}
        />
      );
    },
    sortable: false,
    align: 'center' as const,
    width: '5%',
  };
}

// Helper: Adjust column widths
function adjustColumnWidths(columns: TableColumn[], showHp: boolean, hasDeleteColumn: boolean): void {
  if (!hasDeleteColumn) return;

  if (showHp) {
    // With HP column: Combatant | Initiative | HP | Delete
    if (columns[0]) columns[0].width = '35%';
    if (columns[1]) columns[1].width = '30%';
    if (columns[2]) columns[2].width = '20%';
  } else {
    // Without HP column: Combatant | Initiative | Delete
    if (columns[0]) columns[0].width = '40%';
    if (columns[1]) columns[1].width = '50%';
  }
}

// Helper: Build all columns
function buildColumns(
  combatants: CombatantWithInitiative[],
  currentTurn: number,
  isCombatActive: boolean,
  showHp: boolean,
  onUpdateInitiative: (combatant: CombatantWithInitiative, newInitiative: number) => void,
  onUpdateHp: ((combatant: CombatantWithInitiative, newHp: number) => void) | undefined,
  onDeleteCombatant: ((combatant: CombatantWithInitiative, index: number) => void) | undefined,
): TableColumn[] {
  const columns: TableColumn[] = [createNameColumn(combatants, currentTurn, isCombatActive), createInitiativeColumn(onUpdateInitiative)];

  const hasDeleteColumn = !!onDeleteCombatant;

  if (showHp) {
    columns.push(createHpColumn(onUpdateHp, hasDeleteColumn));
  }

  if (onDeleteCombatant) {
    columns.push(createDeleteColumn(combatants, onDeleteCombatant));
  }

  adjustColumnWidths(columns, showHp, hasDeleteColumn);

  return columns;
}

export default function InitiativeTable({
  combatants,
  currentTurn,
  isCombatActive,
  loading = false,
  onUpdateInitiative,
  onSetCurrentTurn,
  onUpdateHp,
  onDeleteCombatant,
  onRollInitiativeForMonsters,
  showHp = true,
}: InitiativeTableProps) {
  const combatColumns = buildColumns(combatants, currentTurn, isCombatActive, showHp, onUpdateInitiative, onUpdateHp, onDeleteCombatant);

  const hasUnrolledMonsters = isCombatActive && combatants.some((c) => !c.isPlayer && c.initiative === 0);

  return (
    <div>
      {hasUnrolledMonsters && onRollInitiativeForMonsters && (
        <div className="initiative-roll">
          <Button
            onClick={() => {
              onRollInitiativeForMonsters();
            }}
            variant="secondary"
            size="sm"
          >
            Roll Initiative for Monsters
          </Button>
        </div>
      )}

      <Table
        columns={combatColumns}
        data={combatants}
        loading={loading}
        sort={{ key: 'initiative', direction: 'desc' }}
        onRowClick={(_combatant, index) => {
          onSetCurrentTurn(index);
        }}
        hoverable
        getRowKey={(combatant: Record<string, unknown>, index: number) =>
          `${(combatant as CombatantWithInitiative).name}-${(combatant as CombatantWithInitiative).initiative}-${index}`
        }
      />
    </div>
  );
}
