import { ABILITIES, ABILITY_NAMES, type Scores } from '@/rules';

/** The six scores as boxes, as the sheet and the creator's summary both show them. */
export const AbilityScores = ({ scores }: { scores: Scores }) => (
  <dl className="abilities">
    {ABILITIES.map((a) => (
      <div key={a}>
        <dt>
          {a.toUpperCase()}
          <span className="sr-only"> {ABILITY_NAMES[a]}</span>
        </dt>
        <dd>{scores[a]}</dd>
      </div>
    ))}
  </dl>
);
