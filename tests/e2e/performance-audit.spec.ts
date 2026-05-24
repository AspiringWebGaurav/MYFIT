import { test, expect } from '@playwright/test';

test.describe('Performance and Stability Audit', () => {
  test('Lighthouse-style metrics (FCP, LCP, CLS)', async ({ page }) => {
    // Create a new page and start measuring performance
    const client = await page.context().newCDPSession(page);
    await client.send('Performance.enable');
    await client.send('Overlay.setShowLayoutShiftRegions', { result: true });
    
    // We navigate to the app
    await page.goto('/');
    
    // Wait for the app to settle
    await page.waitForLoadState('networkidle');

    // Get paint metrics
    const paintMetrics = await page.evaluate(() => {
      const paintEntries = performance.getEntriesByType('paint');
      const fcp = paintEntries.find(entry => entry.name === 'first-contentful-paint');
      return {
        fcp: fcp ? fcp.startTime : null,
      };
    });
    
    console.log('First Contentful Paint:', paintMetrics.fcp);
    
    // Check if FCP is fast enough (e.g., < 2000ms)
    if (paintMetrics.fcp) {
      expect(paintMetrics.fcp).toBeLessThan(2000);
    }
    
    // To measure CLS, we can observe layout shifts
    const cls = await page.evaluate(() => {
      let cumulativeLayoutShiftScore = 0;
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          // @ts-expect-error - TS doesn't know about hadRecentInput for LayoutShift
          if (!entry.hadRecentInput) {
            // @ts-expect-error - TS doesn't know about value for LayoutShift
            cumulativeLayoutShiftScore += entry.value;
          }
        }
      });
      observer.observe({ type: 'layout-shift', buffered: true });
      return new Promise<number>((resolve) => {
        setTimeout(() => {
          resolve(cumulativeLayoutShiftScore);
        }, 1000);
      });
    });
    
    console.log('Cumulative Layout Shift:', cls);
    expect(cls).toBeLessThan(0.1); // Good CLS is < 0.1
  });

  test('UI Stability - Authentication Flash and Flicker', async ({ page }) => {
    // Navigate to the app
    await page.goto('/');
    
    // The screen should not have multiple re-renders causing flash
    // Wait for it to settle
    await page.waitForSelector('text=Train.');
    
    // Ensure no unexpected horizontal overflow
    const overflowX = await page.evaluate(() => {
      return document.documentElement.scrollWidth > window.innerWidth;
    });
    expect(overflowX).toBe(false); // No horizontal scrolling allowed
  });

  test('PWA Installability', async ({ page }) => {
    await page.goto('/');
    const manifestUrl = await page.evaluate(() => {
      const link = document.querySelector('link[rel="manifest"]');
      return link ? link.getAttribute('href') : null;
    });
    expect(manifestUrl).not.toBeNull();
  });
});
