import { DiceJarCredit } from '@dice-jar/browser';
import { Card, Typography, Badge } from '@/components/ui';
import './Footer.css';

/**
 * Footer Component
 *
 * Serves as the main application footer with navigation links, attribution, and legal information.
 * This component demonstrates excellent UI component library adoption and should serve as a
 * reference implementation for other footer/navigation components.
 *
 * Key Design Patterns:
 * - Perfect integration with design system components (Card, Typography, Badge)
 * - Comprehensive accessibility implementation (ARIA labels, semantic HTML)
 * - Consistent styling through centralized linkStyles variable
 * - Proper external link security (rel="noopener noreferrer")
 * - Mobile-responsive layout with flexbox
 *
 * @example
 * ```tsx
 * <Footer />
 * ```
 */
export function Footer() {
  return (
    <footer role="contentinfo" className="site-footer">
      <div className="site-footer-inner">
        {/* Using Card component from design system for consistent styling */}
        <Card variant="standard" shadow="standard">
          <div className="site-footer-stack">
            {/* Navigation Links */}
            <nav aria-label="Footer Navigation">
              <div className="site-footer-links">
                {/* Donate button using Badge component for visual prominence */}
                <a
                  href="https://www.paypal.com/donate/?business=4BW6AR5BGQZYW&no_recurring=0&item_name=for+CODEX.QUEST+database+fees&currency_code=USD"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="site-footer-donate"
                >
                  <Badge variant="warning" size="md">
                    Donate
                  </Badge>
                </a>
                <a
                  href="https://github.com/gvorbeck/codex-quest/blob/main/LICENSE"
                  target="_blank"
                  rel="noreferrer noopener"
                  data-testid="license-link"
                  className="footer-link"
                >
                  License
                </a>
                <a href="mailto:me@iamgarrett.com" data-testid="contact-link" className="footer-link">
                  Contact
                </a>
                <a
                  href="https://github.com/gvorbeck/codex-quest"
                  target="_blank"
                  rel="noopener noreferrer"
                  data-testid="github-link"
                  className="footer-link"
                >
                  GitHub
                </a>
                <a
                  href="https://www.freeprivacypolicy.com/live/fbe666aa-8172-4c25-86b3-f8b190191f9c"
                  target="_blank"
                  rel="noopener noreferrer"
                  data-testid="privacy-policy-link"
                  className="footer-link"
                >
                  Privacy Policy
                </a>
                <a href="https://bsky.app/profile/codex.quest" target="_blank" rel="noopener noreferrer" className="footer-link">
                  Bluesky
                </a>
              </div>
            </nav>

            {/* Simple divider - using basic border instead of HorizontalRule component 
                as this context calls for a subtle separator rather than decorative element */}
            <div className="site-footer-rule" />

            {/* Copyright section using Typography component for consistent text styling */}
            <Typography variant="bodySmall" color="secondary">
              &copy; {new Date().getFullYear()}{' '}
              <a href="https://iamgarrett.com" target="_blank" rel="noopener noreferrer" className="footer-link">
                J. Garrett Vorbeck
              </a>
            </Typography>

            <Typography variant="bodySmall" color="secondary">
              <DiceJarCredit linkClassName="footer-link" />
            </Typography>

            {/* Game System Attribution */}
            <Typography variant="bodySmall" color="secondary">
              This site is based on the{' '}
              <a href="https://basicfantasy.org" target="_blank" rel="noopener noreferrer" className="footer-link">
                Basic Fantasy Role-Playing Game
              </a>{' '}
              (4th Edition)
            </Typography>

            {/* Other Sites */}
            <div className="site-footer-more">
              <Typography variant="bodySmall" color="secondary" weight="semibold">
                Other Sites
              </Typography>
              <div className="site-footer-sites">
                <a href="https://rollal.one" target="_blank" rel="noopener noreferrer" className="footer-link">
                  Roll Alone
                </a>
                <a href="https://glyph.quest" target="_blank" rel="noopener noreferrer" className="footer-link">
                  Glyph.Quest
                </a>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </footer>
  );
}
