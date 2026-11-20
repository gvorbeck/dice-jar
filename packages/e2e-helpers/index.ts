import AxeBuilder from '@axe-core/playwright';
import { expect, type Page } from '@playwright/test';

/** Fails with the list of accessibility violations (axe) on whatever the page shows now. */
export const expectAccessible = async (page: Page) => {
  await page.emulateMedia({ reducedMotion: 'reduce' }); // entrance animations start at opacity 0, which axe reads as low contrast
  await page.addStyleTag({ content: '*, *::before, *::after { transition: none !important; }' }); // axe reads a colour mid-transition
  await expect(page.getByRole('main')).toBeVisible(); // past the loading fallback
  const { violations } = await new AxeBuilder({ page }).analyze();
  expect(violations.map((v) => `${v.id}: ${v.nodes.map((n) => `${n.target} (${n.any[0]?.message ?? ''})`).join(' | ')}`)).toEqual([]);
};

/** Every game app's footer credits the Dice Jar (the landing page itself does not). */
export const expectDiceJarCredit = (page: Page) =>
  expect(page.getByRole('link', { name: 'Dice Jar', exact: true })).toHaveAttribute('href', 'https://dicejar.games');

/** From a fresh load, the first Tab reaches "Skip to content", and Enter moves focus to <main>. */
export const expectSkipLink = async (page: Page) => {
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: 'Skip to content' })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('main')).toBeFocused();
};
