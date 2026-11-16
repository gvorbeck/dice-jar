import { Text } from '@/components/ui';
import { UseDots } from '@/components/ui/UseDots/UseDots';

interface ArcanaTrackerRowProps {
  label: string;
  total: number;
  checked: number;
  onChange: (value: number) => void;
  disabled?: boolean;
}

// The labelled dot tracker shared by every arcana move (base moves, mystery moves, the minor-card
// reveal). Label on the left, UseDots on the right.
export const ArcanaTrackerRow = ({ label, total, checked, onChange, disabled }: ArcanaTrackerRowProps) => (
  <div className="arcana-tracker-row-tracker">
    <Text as="span" font="serif" size="xs" color="muted" className="arcana-tracker-row-tracker-label">
      {label}
    </Text>
    <UseDots total={total} checked={checked} onChange={onChange} disabled={disabled} ariaLabel={label} />
  </div>
);
