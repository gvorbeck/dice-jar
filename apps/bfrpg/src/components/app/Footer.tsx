import { DiceJarCredit } from '@dice-jar/browser';
import { Typography } from '@/components/ui';
import './Footer.css';

export function Footer() {
  return (
    <footer role="contentinfo" className="site-footer">
      <div className="site-footer-inner">
        <nav aria-label="Footer Navigation" className="site-footer-links">
          <a
            href="https://github.com/gvorbeck/dice-jar/blob/main/apps/bfrpg/LICENSE"
            target="_blank"
            rel="noreferrer noopener"
            data-testid="license-link"
            className="footer-link"
          >
            License
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
        </nav>
        <Typography variant="bodySmall" color="secondary">
          &copy; {new Date().getFullYear()}{' '}
          <a href="https://iamgarrett.com" target="_blank" rel="noopener noreferrer" className="footer-link">
            J. Garrett Vorbeck
          </a>
        </Typography>
        <Typography variant="bodySmall" color="secondary">
          <DiceJarCredit linkClassName="footer-link" />
        </Typography>
        <Typography variant="bodySmall" color="secondary">
          Based on the{' '}
          <a href="https://basicfantasy.org" target="_blank" rel="noopener noreferrer" className="footer-link">
            Basic Fantasy Role-Playing Game
          </a>{' '}
          (4th Edition)
        </Typography>
      </div>
    </footer>
  );
}
