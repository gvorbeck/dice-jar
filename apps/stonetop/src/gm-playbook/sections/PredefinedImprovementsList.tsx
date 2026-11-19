import { cn } from '@dice-jar/cn';
import { Heading, List, Text, Checkbox } from '@/ui';
import { IMPROVEMENTS, type CheckItem } from './steadingImprovementsData';

const makeReqKeys = (impId: string, blockIdx: number, slot: number | string, count: number) =>
  Array.from({ length: count }, (_, i) => `${impId}__req__b${blockIdx}i${slot}__${i}`);

const ReqCheckItem = ({
  item,
  keys,
  checkedValues,
  onToggle,
}: {
  item: CheckItem;
  keys: string[];
  checkedValues: boolean[];
  onToggle: (key: string) => void;
}) => {
  if (keys.length === 1) {
    return (
      <div className="predefined-improvements-list-check-row">
        <Checkbox checked={checkedValues[0]} onChange={() => onToggle(keys[0]!)} label={item.label} />
      </div>
    );
  }

  return (
    <div className="predefined-improvements-list-check-row">
      <div className="predefined-improvements-list-multi-boxes">
        {keys.map((key, i) => (
          <Checkbox key={key} aria-label={item.label} checked={checkedValues[i]} onChange={() => onToggle(key)} />
        ))}
      </div>
      <Text as="span" className="predefined-improvements-list-check-row-label">
        {item.label}
      </Text>
    </div>
  );
};

interface PredefinedImprovementsListProps {
  improvements: Record<string, boolean>;
  onToggleKey: (key: string) => void;
}

export const PredefinedImprovementsList = ({ improvements, onToggleKey }: PredefinedImprovementsListProps) => (
  <div className="predefined-improvements-list">
    {IMPROVEMENTS.map((imp) => {
      const completed = !!improvements[imp.id];
      const itemCx = cn('improvement-card-item', completed && 'improvement-card-item-completed');
      return (
        <div key={imp.id} className={itemCx}>
          <div className="improvement-card-item-header">
            <Checkbox
              checked={completed}
              onChange={() => onToggleKey(imp.id)}
              label={
                <Text as="span" font="serif" size="sm" weight="bold">
                  {imp.title}
                </Text>
              }
              className="improvement-card-item-checkbox"
            />
          </div>
          <Text font="serif" color="muted" italic leading="tight">
            {imp.summary}
          </Text>

          <div className="improvement-card-section">
            <Heading as="h4" size="label">
              Requirements
            </Heading>
            <div className="col gap-3">
              {imp.requirements.map((block, blockIdx) => {
                if (block.type === 'text') {
                  return (
                    <Text key={`${imp.id}-req-${blockIdx}`} size="xs" color="muted">
                      {block.content}
                    </Text>
                  );
                }
                return (
                  <div key={`${imp.id}-cb-${blockIdx}`} className="col gap-2">
                    {block.items.map((item, itemIdx) => {
                      const keys = makeReqKeys(imp.id, blockIdx, item.key ?? itemIdx, item.count ?? 1);
                      const checkedValues = keys.map((k) => !!improvements[k]);
                      return (
                        <ReqCheckItem
                          key={`${imp.id}-b${blockIdx}i${itemIdx}`}
                          item={item}
                          keys={keys}
                          checkedValues={checkedValues}
                          onToggle={onToggleKey}
                        />
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="improvement-card-section">
            <Heading as="h4" size="label">
              When you meet the requirements
            </Heading>
            {imp.benefits.map((line, i) => (
              <Text key={`${imp.id}-benefit-${i}`} font="serif" color="muted" leading="tight">
                {line}
              </Text>
            ))}
            {imp.list && <List variant="bullet" items={imp.list} keyPrefix={`${imp.id}-list`} />}
          </div>
        </div>
      );
    })}
  </div>
);
