import { test, expect } from './fixtures';

test.describe('Equipment Selection Workflow', () => {
  test('buying an item spends gold and adds its weight and cost', async ({ page }) => {
    await page.goto('/new-character');
    const next = page.getByRole('button', { name: /^Go to next step/ });

    await page.getByRole('button', { name: 'Roll All Abilities' }).click();
    await next.click();
    await page.getByLabel('Race*').selectOption('human');
    await next.click();
    await page.getByLabel('Class*').selectOption('fighter');
    await next.click();
    await page
      .getByRole('button', { name: /roll.*d8/i })
      .first()
      .click();
    await next.click();
    await expect(page.locator('#step-content-heading').filter({ hasText: 'Equipment' })).toBeVisible();

    await page.getByRole('spinbutton', { name: /Result of 3d6\*10 roll/ }).fill('100');
    await expect(page.getByText('Current: 100 gp')).toBeVisible();

    await page.getByRole('tab', { name: 'Individual Items' }).click();
    await page.getByLabel('Filter accordion items').fill('Dagger');
    // A dagger costs 2 gp and weighs 1 lb (equipment.json).
    await page
      .locator('.shop-item')
      .filter({ has: page.getByText('Dagger', { exact: true }) })
      .getByRole('button', { name: 'Add' })
      .click();

    await expect(page.getByText('Current: 98 gp')).toBeVisible();
    const inventory = page.locator('.kit-inventory');
    await expect(inventory.getByText('Dagger', { exact: true })).toBeVisible();
    const stat = (label: string) => inventory.locator('.stat').filter({ hasText: label }).locator('.stat-value');
    await expect(stat('Total Weight')).toHaveText('1 lbs');
    await expect(stat('Total Value')).toHaveText('2 gp');
  });
});
