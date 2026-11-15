import { Tab, TabList } from 'react-aria-components';
import styles from './ArcanaSubTabs.module.css';

export type ArcanaSubTab = 'minor' | 'major';

interface ArcanaSubTabsProps {
  minorCount: number;
  majorCount: number;
}

// Rendered inside the <Tabs> in ArcanaTab; React Aria handles the arrow, Home and End keys.
export const ArcanaSubTabs = ({ minorCount, majorCount }: ArcanaSubTabsProps) => (
  <div className={styles.tabRow}>
    <TabList className={styles.subTabBar} aria-label="Arcana">
      <Tab id="minor" className={styles.subTab}>
        Minor Arcana
        {minorCount > 0 && <span className={styles.badge}>{minorCount}</span>}
      </Tab>
      <Tab id="major" className={styles.subTab}>
        Major Arcana
        {majorCount > 0 && <span className={styles.badge}>{majorCount}</span>}
      </Tab>
    </TabList>
  </div>
);
