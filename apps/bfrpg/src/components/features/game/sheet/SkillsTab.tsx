import { memo } from 'react';
import { Card, Typography } from '@/components/ui/core/display';
import { LoadingState } from '@/components/ui/core/feedback';
import type { TableColumn } from '@/components/ui/composite/Table';
import { CLASSES_WITH_SKILLS, SKILL_DESCRIPTIONS, ALL_SKILLS } from '@/constants';
import type { ClassSkillData, Game, SkillTableRow } from '@/types';
import { usePlayerCharacters, useSkillDataByClass, useSkillColumns } from '@/hooks';
import './SkillsTab.css';

interface SkillsTabProps {
  game: Game;
  className?: string;
}

interface SkillClassTableProps {
  classData: ClassSkillData;
  columns: TableColumn<SkillTableRow>[];
}

interface EnhancedSkillTableProps {
  columns: TableColumn<SkillTableRow>[];
  data: SkillTableRow[];
  caption: string;
}

/**
 * Enhanced table with player row highlighting and accessibility features
 */
const EnhancedSkillTable = memo(({ columns, data, caption }: EnhancedSkillTableProps) => {
  return (
    <div className="skills-wrap">
      <table className="skills-table" role="table" aria-label={caption}>
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr role="row">
            {columns.map((column) => (
              <th
                key={column.key}
                role="columnheader"
                scope="col"
                aria-label={column.ariaLabel || (typeof column.header === 'string' ? column.header : undefined)}
              >
                {typeof column.header === 'string' &&
                column.key in ALL_SKILLS &&
                SKILL_DESCRIPTIONS[column.key as keyof typeof SKILL_DESCRIPTIONS] ? (
                  <span className="skills-hint" title={SKILL_DESCRIPTIONS[column.key as keyof typeof SKILL_DESCRIPTIONS]}>
                    {column.header}
                  </span>
                ) : (
                  column.header
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row) => (
            <tr
              key={row.id}
              role="row"
              aria-label={row.isPlayer ? `${row.characterName} at level ${row.level}` : `Level ${row.level} progression`}
              data-player={row.isPlayer}
            >
              {columns.map((column) => {
                const cellContent = column.cell ? column.cell(row) : row[column.key as keyof SkillTableRow];

                return (
                  <td key={`${row.id}-${column.key}`} data-align={column.align}>
                    {cellContent}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
});

EnhancedSkillTable.displayName = 'EnhancedSkillTable';

/**
 * Wrapper component that properly calls the hook
 */
const SkillClassTableWrapper = memo(({ classData }: { classData: ClassSkillData }) => {
  const columns = useSkillColumns(classData);

  return <SkillClassTable classData={classData} columns={columns} />;
});

SkillClassTableWrapper.displayName = 'SkillClassTableWrapper';

/**
 * Individual skill class table with enhanced accessibility and performance
 */
const SkillClassTable = memo(({ classData, columns }: SkillClassTableProps) => {
  return (
    <Card className="skills-card">
      <div className="skills-card-head">
        <Typography variant="h4" weight="semibold" id={`${classData.classId}-heading`}>
          {classData.displayName}
        </Typography>
      </div>

      <div className="skills-card-body">
        <EnhancedSkillTable columns={columns} data={classData.skills} caption={`${classData.displayName} skill progression by level`} />
      </div>

      {classData.skills.some((skill) => skill.isPlayer) && (
        <div className="skills-note">
          <div role="note">
            <div className="skills-swatch" aria-hidden="true"></div>
            <span>Player character rows are highlighted</span>
          </div>
        </div>
      )}
    </Card>
  );
});

SkillClassTable.displayName = 'SkillClassTable';

export const SkillsTab = memo(({ game, className }: SkillsTabProps) => {
  // Use custom hooks for data management
  const { playerCharacters, loading, error } = usePlayerCharacters(game);
  const skillDataByClass = useSkillDataByClass(playerCharacters, game);

  if (loading) {
    return <LoadingState message="Loading skill data..." />;
  }

  if (error) {
    return (
      <Card className={className}>
        <div className="skills-empty">
          <Typography variant="body" color="secondary">
            {error}
          </Typography>
          <Typography variant="caption" color="muted">
            Unable to load player character data. Please try refreshing the page.
          </Typography>
        </div>
      </Card>
    );
  }

  if (skillDataByClass.length === 0) {
    return (
      <Card className={className}>
        <div className="skills-empty">
          <Typography variant="body" color="secondary">
            No players with skill-based classes found in this game.
          </Typography>
          <Typography variant="caption" color="muted">
            Classes with skills:{' '}
            {Object.values(CLASSES_WITH_SKILLS)
              .map((c) => c.displayName)
              .join(', ')}
          </Typography>
        </div>
      </Card>
    );
  }

  return (
    <div className={className} role="region" aria-label="Skill progression tables">
      <div className="skills-tables">
        {skillDataByClass.map((classData) => (
          <SkillClassTableWrapper key={classData.classId} classData={classData} />
        ))}
      </div>
    </div>
  );
});

SkillsTab.displayName = 'SkillsTab';
