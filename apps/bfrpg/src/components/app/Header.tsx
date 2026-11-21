import { Link } from 'wouter';
import { useState } from 'react';
import { Button, Image } from '@/components/ui';
import { Typography } from '@/components/ui/core/display';
import { useAuth } from '@/hooks';
import { signOut, isMockMode, devUtils } from '@/services';
import { logger } from '@/utils';
import { DOM_IDS, CSS_CLASSES, HTML_ROLES } from '@/constants';
import { GlobalAlert } from '@/components/app/GlobalAlert';
import type { AlertConfig } from '@/constants';
import './Header.css';

interface HeaderProps {
  setIsSignInModalOpen: (open: boolean) => void;
  alerts: AlertConfig[];
  onAlertClose: (alertIndex: number) => void;
}

export function Header({ setIsSignInModalOpen, alerts, onAlertClose }: HeaderProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user } = useAuth();

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      logger.error('Sign out error:', error);
    }
  };

  const getDevUtils = () => {
    return devUtils || (window as unknown as { devUtils?: typeof devUtils }).devUtils;
  };

  const handleResetMockData = () => {
    if (isMockMode()) {
      const utils = getDevUtils();
      if (utils) {
        utils.resetAllData();
        // Reload the page to see the reset data
        window.location.reload();
      } else {
        // Manual fallback if devUtils isn't available
        logger.warn('devUtils not available, clearing localStorage manually');
        localStorage.removeItem('mock_characters');
        localStorage.removeItem('mock_characters_sample_initialized');
        localStorage.removeItem('mock_games');
        localStorage.removeItem('mock_games_sample_initialized');
        window.location.reload();
      }
    }
  };

  return (
    <>
      <a href={`#${DOM_IDS.MAIN_CONTENT}`} className={CSS_CLASSES.SKIP_LINK}>
        Skip to main content
      </a>

      <header role={HTML_ROLES.BANNER} className="site-header">
        <nav role="navigation" aria-label="Main navigation" className="site-nav">
          <div className="site-bar">
            {/* Logo & Brand */}
            <div className="site-brand-wrap">
              <Link href="/" aria-label={`${isMockMode() ? 'Codex.Mock' : 'Codex.Quest'} - Go to homepage`} className="site-brand">
                <div className="site-logo-wrap">
                  <Image
                    variant="logo"
                    src="/images/logo.webp"
                    alt={`${isMockMode() ? 'Codex.Mock' : 'Codex.Quest'} logo`}
                    className="site-logo"
                  />
                  <div className="site-glow"></div>
                </div>
                <Typography variant="h3" as="h1" color="amber" className="site-title">
                  {isMockMode() ? 'Codex.Mock' : 'Codex.Quest'}
                </Typography>
              </Link>
            </div>

            {/* Mock Mode Reset Button */}
            {isMockMode() && (
              <div className="site-row">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleResetMockData}
                  title="Reset all data to original sample data"
                  icon="settings"
                >
                  Reset Sample Data
                </Button>
              </div>
            )}

            {/* Desktop Authentication */}
            <div className="site-bar-end">
              <div className="site-auth">
                {user ? (
                  <div className="site-auth">
                    <div className="site-user">
                      <Typography variant="bodySmall" color="amber" weight="medium">
                        {user.email?.split('@')[0]}
                      </Typography>
                      <Typography variant="caption" color="secondary">
                        Signed in
                      </Typography>
                    </div>
                    <Button variant="ghost" size="sm" onClick={handleSignOut}>
                      Sign Out
                    </Button>
                  </div>
                ) : (
                  <Button variant="secondary" size="md" onClick={() => setIsSignInModalOpen(true)}>
                    Sign In
                  </Button>
                )}
              </div>
            </div>

            {/* Mobile menu button */}
            <div className="site-menu-toggle">
              <Button
                variant="ghost"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                aria-controls="mobile-menu"
                aria-expanded={isMobileMenuOpen}
                aria-label="Toggle mobile menu"
                icon={!isMobileMenuOpen ? 'menu' : 'close'}
                iconSize="lg"
              >
                <span className="sr-only">{isMobileMenuOpen ? 'Close main menu' : 'Open main menu'}</span>
              </Button>
            </div>
          </div>

          {/* Mobile menu */}
          <div className="site-menu" data-open={isMobileMenuOpen || undefined} id="mobile-menu">
            <div className="site-menu-inner">
              {/* Mobile Authentication */}
              <div>
                {user ? (
                  <div className="site-menu-stack">
                    <div className="site-menu-user">
                      <Typography variant="bodySmall" color="amber" weight="medium">
                        {user.email?.split('@')[0]}
                      </Typography>
                      <Typography variant="caption" color="secondary">
                        {user.email}
                      </Typography>
                    </div>
                    <Button
                      variant="ghost"
                      onClick={() => {
                        handleSignOut();
                        setIsMobileMenuOpen(false);
                      }}
                      icon="close"
                      iconSize="sm"
                      className="site-menu-signout"
                    >
                      <span>Sign Out</span>
                    </Button>
                  </div>
                ) : (
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setIsSignInModalOpen(true);
                      setIsMobileMenuOpen(false);
                    }}
                  >
                    Sign In
                  </Button>
                )}
              </div>
            </div>
          </div>
        </nav>
      </header>
      {alerts.length > 0 && (
        <div className="site-alerts">
          {alerts.map((alert, index) => (
            <GlobalAlert key={`alert-${index}`} alert={alert} onClose={() => onAlertClose(index)} />
          ))}
        </div>
      )}
    </>
  );
}
