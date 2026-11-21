import { test, expect } from '@playwright/test';

test.describe('Modal', () => {
  test('closes on Escape and on outside click, and returns focus to the opener', async ({ page }) => {
    await page.goto('/');
    const opener = page.getByRole('button', { name: 'Import' });
    const dialog = page.getByRole('dialog');

    await opener.click();
    await expect(dialog).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
    await expect(opener).toBeFocused();

    await opener.click();
    await expect(dialog).toBeVisible();
    await page.mouse.click(5, 5);
    await expect(dialog).toBeHidden();
    await expect(opener).toBeFocused();
  });
});
