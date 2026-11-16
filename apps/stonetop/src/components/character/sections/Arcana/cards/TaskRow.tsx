import { memo, useCallback } from 'react';
import { Checkbox, Text } from '@/components/ui';

interface TaskRowProps {
  taskKey: string;
  task: string;
  checked: boolean;
  onToggle: (key: string, checked: boolean) => void;
}

export const TaskRow = memo(({ taskKey, task, checked, onToggle }: TaskRowProps) => {
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => onToggle(taskKey, e.target.checked), [taskKey, onToggle]);
  return (
    <label className="arcana-card-task-row">
      <Checkbox checked={checked} onChange={handleChange} />
      <Text as="span" font="serif">
        {task}
      </Text>
    </label>
  );
});
