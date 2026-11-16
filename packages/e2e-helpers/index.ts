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
