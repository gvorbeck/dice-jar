import { Text, List, Input } from '@/ui';
import { useDebouncedTextField } from '@/lib/useDebouncedTextField';

interface IWonderProps {
  value: string;
  onSave: (value: string) => Promise<void>;
}

export const IWonder = ({ value, onSave }: IWonderProps) => {
  const questions = useDebouncedTextField(value, onSave);

  return (
    <div className="col gap-4">
      <div className="col gap-3">
        <Text size="xs">Keep a running list of open questions that either…</Text>
        <List variant="bullet" items={["you don't know how to answer yet, or", 'you want to answer via play.']} />
        <Text size="xs">Update this list between each session.</Text>
      </div>
      <Input multiline label="Questions" rows={12} {...questions} />
    </div>
  );
};
