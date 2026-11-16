import { Tab, TabList } from 'react-aria-components';

export type ArcanaSubTab = 'minor' | 'major';

interface ArcanaSubTabsProps {
  minorCount: number;
  majorCount: number;
}

// Rendered inside the <Tabs> in ArcanaTab; React Aria handles the arrow, Home and End keys.
export const ArcanaSubTabs = ({ minorCount, majorCount }: ArcanaSubTabsProps) => (
  <div className="arcana-sub-tabs-tab-row">
    <TabList className="arcana-sub-tabs-sub-tab-bar" aria-label="Arcana">
      <Tab id="minor" className="arcana-sub-tabs-sub-tab">
        Minor Arcana
        {minorCount > 0 && <span className="arcana-sub-tabs-badge">{minorCount}</span>}
      </Tab>
      <Tab id="major" className="arcana-sub-tabs-sub-tab">
        Major Arcana
        {majorCount > 0 && <span className="arcana-sub-tabs-badge">{majorCount}</span>}
      </Tab>
    </TabList>
  </div>
);
