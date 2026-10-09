// @ts-check
import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
});

test('starts empty', async ({ page }) => {
  await expect(page.getByRole('heading', { name: 'Todos' })).toBeVisible();
  await expect(page.getByRole('listitem')).toHaveCount(0);
  await expect(page.locator('#count')).toHaveText('0 items left');
});

// TODO: add todos, complete one, filter, ignore empty input
