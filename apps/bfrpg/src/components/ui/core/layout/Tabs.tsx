import type { ReactNode } from 'react';
import { Tab as AriaTab, TabList as AriaTabList, TabPanel as AriaTabPanel, Tabs as AriaTabs } from 'react-aria-components';
import './Tabs.css';

// Keeps the `value` API the callers use; React Aria supplies the roles, arrow-key movement and focus handling.
interface TabsProps {
  children: ReactNode;
  defaultValue?: string;
  value?: string;
  onValueChange?: (value: string) => void;
}

const Tabs = ({ children, defaultValue, value, onValueChange }: TabsProps) => (
  <AriaTabs
    className="tabs"
    {...(defaultValue !== undefined && { defaultSelectedKey: defaultValue })}
    {...(value !== undefined && { selectedKey: value })}
    onSelectionChange={(key) => onValueChange?.(String(key))}
  >
    {children}
  </AriaTabs>
);

const TabList = ({ children, 'aria-label': label }: { children: ReactNode; 'aria-label': string }) => (
  <AriaTabList className="tabs-list" aria-label={label}>
    {children}
  </AriaTabList>
);

const Tab = ({ children, value }: { children: ReactNode; value: string }) => (
  <AriaTab id={value} className="tabs-tab">
    {children}
  </AriaTab>
);

const TabPanels = ({ children }: { children: ReactNode }) => <div className="tabs-panels">{children}</div>;

const TabPanel = ({ children, value }: { children: ReactNode; value: string }) => <AriaTabPanel id={value}>{children}</AriaTabPanel>;

export { Tabs, TabList, Tab, TabPanels, TabPanel };
