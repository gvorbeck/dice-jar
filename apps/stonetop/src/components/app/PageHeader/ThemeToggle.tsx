import { Toggle, Icon } from '@/components/ui';
import { useColorScheme } from '@/hooks/useColorScheme';

export const ThemeToggle = () => {
  const { scheme, toggle } = useColorScheme();
  const isLight = scheme === 'light';

  return (
    <div className="theme-toggle-wrapper">
      <Icon name="moon" size="small" className={!isLight ? 'theme-toggle-icon-active' : undefined} />
      <Toggle aria-label={isLight ? 'Switch to dark mode' : 'Switch to light mode'} checked={isLight} onChange={toggle} />
      <Icon name="sun" size="small" className={isLight ? 'theme-toggle-icon-active' : undefined} />
    </div>
  );
};
