import { useMemo } from 'react';
import { cn } from '@dice-jar/cn';
import './StatusIndicator.css';

interface StatusThreshold {
  /** Minimum percentage for this status (0-100) */
  min: number;
  /** Maximum percentage for this status (0-100) */
  max: number;
  /** Colour of the label and bar */
  tone: 'cyan' | 'lime' | 'yellow' | 'orange' | 'red' | 'gray';
  /** Status label */
  label: string;
}

interface StatusIndicatorProps {
  /** Current value */
  current: number;
  /** Maximum value */
  max: number;
  /** Custom status thresholds (defaults to health-based thresholds) */
  thresholds?: StatusThreshold[];
  /** Whether to show the progress bar */
  showBar?: boolean;
  /** Whether to show the status label */
  showLabel?: boolean;
  /** Additional CSS classes */
  className?: string;
}

// Default health-based thresholds
const DEFAULT_HEALTH_THRESHOLDS: StatusThreshold[] = [
  {
    min: 101,
    max: Infinity,
    tone: 'cyan',
    label: 'Temporary HP',
  },
  {
    min: 75,
    max: 101,
    tone: 'lime',
    label: 'Healthy',
  },
  {
    min: 50,
    max: 75,
    tone: 'yellow',
    label: 'Lightly Wounded',
  },
  {
    min: 25,
    max: 50,
    tone: 'orange',
    label: 'Moderately Wounded',
  },
  {
    min: 1,
    max: 25,
    tone: 'red',
    label: 'Heavily Wounded',
  },
  {
    min: 0.1,
    max: 1,
    tone: 'red',
    label: 'Critically Wounded',
  },
  {
    min: 0,
    max: 0.1,
    tone: 'gray',
    label: 'Unconscious/Dead',
  },
];

function StatusIndicator({
  current,
  max,
  thresholds = DEFAULT_HEALTH_THRESHOLDS,
  showBar = true,
  showLabel = true,
  className,
}: StatusIndicatorProps) {
  const { percentage, status } = useMemo((): {
    percentage: number;
    status: StatusThreshold;
  } => {
    const safeThresholds = thresholds.length > 0 ? thresholds : DEFAULT_HEALTH_THRESHOLDS;
    const defaultStatus = safeThresholds[safeThresholds.length - 1];

    // Ensure we have a valid default status
    if (!defaultStatus) {
      throw new Error('No valid status thresholds provided');
    }

    if (max === 0) return { percentage: 0, status: defaultStatus };

    const pct = Math.max(0, (current / max) * 100);

    // Special case for values above max (temporary HP)
    if (current > max) {
      const tempStatus = safeThresholds.find((t) => t.min > 100);
      if (tempStatus) {
        return { percentage: 100, status: tempStatus };
      }
    }

    // Find the appropriate status threshold
    const currentStatus = safeThresholds.find((threshold) => pct >= threshold.min && pct < threshold.max);

    // Fallback to the last threshold if none found
    const finalStatus = currentStatus || defaultStatus;

    return { percentage: Math.min(100, pct), status: finalStatus };
  }, [current, max, thresholds]);

  return (
    <div className={cn('status-indicator', className)} data-tone={status.tone}>
      {showBar && <progress className="status-bar" value={percentage} max={100} aria-label={status.label} />}
      {showLabel && (
        <div className="status-label">
          <span>{status.label}</span>
        </div>
      )}
    </div>
  );
}

export default StatusIndicator;
export type { StatusThreshold };
