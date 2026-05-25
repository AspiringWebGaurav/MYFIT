import { test, expect } from '@playwright/test';

test.describe('Training Journal UX & Persistence', () => {

  test.beforeEach(async ({ page }) => {
    // Setup initial state or mock if needed
    // Usually we log in first. Assume e2e setup handles it or we mock auth
    await page.addInitScript(() => {
      // @ts-expect-error Mock user context if relying on e2e window hooks
      window.__E2E_MOCK_USER__ = { email: 'test@myfit.app', uid: 'test_uid', displayName: 'Test User' };
      // @ts-expect-error Mock status
      window.__E2E_MOCK_STATUS__ = 'approved';
    });
    await page.goto('/');
    
    // Wait for the shell to load
    await page.waitForSelector('#mobile-shell, .app-shell, body');
    // If hamburger menu exists (mobile), click it
    const menuBtn = page.locator('button:has(.lucide-menu)');
    if (await menuBtn.isVisible()) {
      await menuBtn.click();
    }
    
    // Navigate to Training Journal
    await page.click('button:has-text("Training Journal"), a:has-text("Training Journal"), [role="menuitem"]:has-text("Training Journal")');
    // Wait for empty state or list to appear
    await page.waitForSelector('text=Training Journal');
  });

  test('Empty state & Quick Actions Flow', async ({ page }) => {
    await expect(page.locator('text=No notes yet')).toBeVisible();
    
    // Test Quick Template
    await page.click('button:has-text("Chest")');
    // Should open editor with chest template
    await expect(page.locator('textarea')).toHaveValue(/Today's Chest Session/);
    
    // Go back
    await page.click('button:has(.lucide-chevron-left)');
    // Note should be in the list now
    await expect(page.locator('text=No notes yet')).not.toBeVisible();
    await expect(page.locator('h4:has-text("Today\'s Chest Session")')).toBeVisible();
  });

  test('Manual Creation via Modal', async ({ page }) => {
    await page.click('button:has-text("Create Note")');
    await page.waitForSelector('text=Create Note');
    await page.fill('input[placeholder="e.g., Chest Progress"]', 'My Custom Title');
    await page.fill('textarea[placeholder="Start writing..."]', 'This is my custom content.');
    await page.click('button:has-text("Create")');
    
    // Validate card appears
    await expect(page.locator('h4:has-text("My Custom Title")')).toBeVisible();
    await expect(page.locator('p:has-text("This is my custom content.")')).toBeVisible();
  });

  test('Rapid typing stress test & Debounce', async ({ page }) => {
    await page.click('button:has-text("Create Note")');
    await page.fill('textarea[placeholder="Start writing..."]', 'Stress test');
    await page.click('button:has-text("Create")');
    
    // Open the note
    await page.click('text=Stress test');
    
    const textarea = page.locator('textarea');
    // Rapid typing
    for (let i = 0; i < 30; i++) {
      await textarea.press('a');
    }
    
    // Expect saving state
    await expect(page.locator('text=Saving...')).toBeVisible();
    
    // Wait for debounce sync
    await page.waitForTimeout(3500);
    await expect(page.locator('text=Saved')).toBeVisible();
  });

  test('Hard refresh persistence', async ({ page }) => {
    await page.click('button:has-text("Diet")');
    await page.click('button:has(.lucide-chevron-left)');
    await expect(page.locator('h4:has-text("Today\'s Diet Notes")')).toBeVisible();
    
    await page.reload();
    await page.click('button:has-text("Training Journal")');
    
    // Should still exist after reload
    await expect(page.locator('h4:has-text("Today\'s Diet Notes")')).toBeVisible();
  });

  test('App background save (visibilitychange)', async ({ page }) => {
    await page.click('button:has-text("Progress")');
    
    const textarea = page.locator('textarea');
    await textarea.type('Added some quick background text');
    
    // Trigger visibilitychange hidden to force save
    await page.evaluate(() => {
      Object.defineProperty(document, 'visibilityState', { value: 'hidden', writable: true });
      document.dispatchEvent(new Event('visibilitychange'));
    });
    
    await page.reload();
    await page.click('button:has-text("Training Journal")');
    
    // Data should be preserved
    await expect(page.locator('p:has-text("Added some quick background text")')).toBeVisible();
  });

  test('50+ notes scroll performance', async ({ page }) => {
    // Generate 50 notes via local script injection
    await page.evaluate(() => {
      // @ts-expect-error store access for test
      const store = window.useTrainingJournalStore?.getState?.();
      if (!store) return;
      for (let i = 0; i < 50; i++) {
        store.createNote(`Scroll Test Note ${i}\n\nSnippet ${i}`);
      }
    });
    
    await page.waitForTimeout(1000); // Wait for state updates
    
    // Ensure we can scroll through them
    const listContainer = page.locator('main');
    await listContainer.evaluate(el => el.scrollTo(0, el.scrollHeight));
    
    await expect(page.locator('text=Scroll Test Note 0')).toBeVisible();
  });

});
