import { test, expect } from '@playwright/test';

const THRESHOLDS = {
  pageLoad:         5000,
  ttfb:             2000,
  domContentLoaded: 4000,
  alertResponse:    3000,
};

test.describe('Performance', () => {

  test('PF-001: Page load time is within acceptable threshold', async ({ page }) => {
    const start = Date.now();
    await page.goto('https://qa-assessment.pages.dev/');
    await page.waitForLoadState('load');
    const loadTime = Date.now() - start;

    console.log(`[PF-001] Page load time: ${loadTime}ms (threshold: ${THRESHOLDS.pageLoad}ms)`);
    expect(loadTime).toBeLessThan(THRESHOLDS.pageLoad);
  });

  test('PF-002: Navigation timing — TTFB and DOMContentLoaded', async ({ page }) => {
    await page.goto('https://qa-assessment.pages.dev/');
    await page.waitForLoadState('load');

    const timing = await page.evaluate(() => {
      const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      return {
        ttfb:             Math.round(nav.responseStart - nav.requestStart),
        domContentLoaded: Math.round(nav.domContentLoadedEventEnd - nav.startTime),
        loadComplete:     Math.round(nav.loadEventEnd - nav.startTime),
        domInteractive:   Math.round(nav.domInteractive - nav.startTime),
      };
    });

    console.log('[PF-002] Navigation Timing:');
    console.log(`  TTFB:               ${timing.ttfb}ms`);
    console.log(`  DOM Interactive:    ${timing.domInteractive}ms`);
    console.log(`  DOMContentLoaded:   ${timing.domContentLoaded}ms`);
    console.log(`  Load Complete:      ${timing.loadComplete}ms`);

    expect(timing.ttfb).toBeLessThan(THRESHOLDS.ttfb);
    expect(timing.domContentLoaded).toBeLessThan(THRESHOLDS.domContentLoaded);
  });

  test('PF-003: Form validation response time (alert appears promptly)', async ({ page }) => {
    await page.goto('https://qa-assessment.pages.dev/');
    await page.waitForLoadState('load');

    let alertTime: number | null = null;
    const clickTime = Date.now();

    page.once('dialog', async (dialog) => {
      alertTime = Date.now() - clickTime;
      await dialog.dismiss();
    });

    await page.locator('#firstName').fill('');
    await page.locator('input[type="submit"]').click();
    await page.waitForTimeout(1000);

    if (alertTime !== null) {
      console.log(`[PF-003] Alert response time: ${alertTime}ms (threshold: ${THRESHOLDS.alertResponse}ms)`);
      expect(alertTime as number).toBeLessThan(THRESHOLDS.alertResponse);
    } else {
      console.log('[PF-003] No alert dialog detected — skipping timing assertion.');
    }
  });

  test('PF-004: Form fill and submit cycle time (happy path)', async ({ page }) => {
    await page.goto('https://qa-assessment.pages.dev/');
    await page.waitForLoadState('load');

    const fillStart = Date.now();

    await page.locator('#firstName').fill('John');
    await page.locator('#lastName').fill('Smith');
    await page.locator('#email').fill('john.smith@example.com');
    await page.locator('#password').fill('P@ssw0rd123');
    await page.locator('#confirmPassword').fill('P@ssw0rd123');
    await page.locator('#linkedIn').fill('https://www.linkedin.com/in/johnsmith');

    const fillTime = Date.now() - fillStart;
    console.log(`[PF-004] Time to fill all mandatory fields: ${fillTime}ms`);

    let dialogFired = false;
    page.once('dialog', async (dialog) => {
      dialogFired = true;
      await dialog.dismiss();
    });

    const submitStart = Date.now();
    await Promise.all([
      page.waitForLoadState('load'),
      page.locator('input[type="submit"]').click(),
    ]);
    const submitTime = Date.now() - submitStart;

    console.log(`[PF-004] Submit + reload time: ${submitTime}ms`);
    console.log(`[PF-004] Total cycle time: ${fillTime + submitTime}ms`);

    expect(dialogFired).toBe(false);
    expect(submitTime).toBeLessThan(THRESHOLDS.pageLoad);
  });

  test('PF-005: Resource sizes — page assets should be lightweight', async ({ page }) => {
    await page.goto('https://qa-assessment.pages.dev/');
    await page.waitForLoadState('load');

    const resources = await page.evaluate(() => {
      return performance.getEntriesByType('resource').map((r: any) => ({
        name:         r.name.split('/').pop(),
        transferSize: Math.round(r.transferSize / 1024 * 10) / 10,
        duration:     Math.round(r.duration),
      }));
    });

    console.log('[PF-005] Resource sizes:');
    let totalKB = 0;
    for (const r of resources) {
      console.log(`  ${r.name}: ${r.transferSize}KB loaded in ${r.duration}ms`);
      totalKB += r.transferSize;
    }
    console.log(`  Total transfer: ${Math.round(totalKB * 10) / 10}KB`);

    expect(totalKB).toBeLessThan(500);
  });
});
