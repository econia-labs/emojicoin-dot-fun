import { test, expect } from '@playwright/test';

const sleep = (ms: number) => {
    return new Promise(resolve => setTimeout(resolve, ms));
}

test('api test route', async ({ page }) => {
  const numeicRegex = /^[0-9]+$/;

  // Query a first time.
  const res1 = await page.goto('/test');
  const res1text = await res1.text();

  expect(res1text).toMatch(numeicRegex)

  // Query a second time after a second.
  // The result should be the same as the route has a 2 second cache.
  await sleep(1000);
  const res2 = await page.reload();
  const res2text = await res2.text();

  expect(res2text).toBe(res1text);

  // Query a second time after 1200ms.
  // The result should be different and greater as the route has a 2 second cache.
  await sleep(1200);

  const res3 = await page.reload();
  const res3text = await res3.text();

  expect(res3text).toMatch(numeicRegex);

  expect(BigInt(res1text)).toBeLessThan(BigInt(res3text));
});
