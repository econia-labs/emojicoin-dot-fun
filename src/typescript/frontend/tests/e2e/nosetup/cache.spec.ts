import { test, expect, Page } from "@playwright/test";

/**
 * Cache revalidation timing constants (in seconds)
 * Should match the values inside /cache-test/[a|b].tsx and /cache-test/fetchData.ts
 */
const CACHE_TIMINGS = {
  UNSTABLE_CACHE: 30,
  EC_FETCH: 20,
  PAGE_A: 40,
  PAGE_B: 10,
} as const;

const TIMING_BUFFER = 3;

/**
 * Helper function to get element text content
 * @param page Playwright page object
 * @param selector Element selector
 * @returns Promise resolving to element text
 * @throws Error if element is not found
 */
const getElementText = async (page: Page, selector: string): Promise<string> => {
  try {
    await page.waitForSelector(selector, { state: "attached" });
    const element = await page.$(selector);
    if (!element) {
      throw new Error(`Element not found: ${selector}`);
    }
    return await element.innerText();
  } catch (error) {
    throw new Error(`Failed to get element text for ${selector}: ${error}`);
  }
};

const sleep = (s: number) => {
  return new Promise((resolve) => setTimeout(resolve, s * 1000));
};

/**
 * Page object representing cache test pages
 */
class CacheTestPage {
  private startTime: number;
  constructor(private page: Page) {
    this.startTime = Date.now();
  }

  async navigate(path: "a" | "b" | "c") {
    await this.page.goto(`/test/cache/${path}`);
    // Ensures the page is fully loaded
    await this.page.waitForSelector("#unstable_cache");
  }

  async getUnstableCacheText() {
    return getElementText(this.page, "#unstable_cache");
  }

  async getEcFetchText() {
    return getElementText(this.page, "#fetch_revalidate");
  }

  async reload() {
    await this.page.reload();
    // Ensures the page is fully loaded
    await this.page.waitForSelector("#unstable_cache");
  }

  async waitForTarget(targetSeconds: number) {
    const elapsedSeconds = (Date.now() - this.startTime) / 1000;
    const remainingSeconds = Math.max(0, targetSeconds + TIMING_BUFFER - elapsedSeconds);

    if (remainingSeconds > 0) {
      await sleep(remainingSeconds);
    }
  }
}

/**
 * Tests Next.js caching behavior across pages and revalidation strategies
 * If /test/cache/a|b|c.tsx was visited less than 40 seconds before running this test, it will fail.
 * All cached data should be stale before running this test, otherwise the timings will be incorrect.
 */
test.describe("Next.js Cache Behavior", () => {
  test("Caching with unstable_cache and fetch should behave the same. Caching time from unstable_cache and fetch should not be affected by caching times from pages", async ({
    page,
  }) => {
    const cachePage = new CacheTestPage(page);

    // Initial page A visit.
    await cachePage.navigate("a");
    // Reload once in case there is stale data.
    await cachePage.reload();
    const initialUnstableCache = await cachePage.getUnstableCacheText();
    const initialEcFetch = await cachePage.getEcFetchText();

    expect(initialUnstableCache, "Initial unstable cache should have content").not.toBe("");
    expect(initialEcFetch, "Initial EC fetch should have content").not.toBe("");

    // Visit page B and verify initial cache sharing.
    await cachePage.navigate("b");
    expect(
      await cachePage.getUnstableCacheText(),
      "Page B should show the same data as Page A with unstable_cache"
    ).toBe(initialUnstableCache);
    expect(
      await cachePage.getEcFetchText(),
      "Page B should show the same data as Page A with ecFetch"
    ).toBe(initialEcFetch);

    // Visit page C and verify initial cache sharing.
    await cachePage.navigate("c");
    expect(
      await cachePage.getUnstableCacheText(),
      "force-dynamic on page C should have no impact on data cached with unstable_cache"
    ).toBe(initialUnstableCache);
    expect(
      await cachePage.getEcFetchText(),
      "Page C with force-dynamic should have no impact on data cached with fetch"
    ).toBe(initialEcFetch);

    // Wait for Page B revalidate time.
    await cachePage.waitForTarget(CACHE_TIMINGS.PAGE_B);
    // Reload twice in case there is stale data.
    await cachePage.reload();
    await cachePage.reload();
    expect(
      await cachePage.getUnstableCacheText(),
      "Page B caching time should have no impact on data fetched with unstable cache"
    ).toBe(initialUnstableCache);
    expect(
      await cachePage.getEcFetchText(),
      "Page B caching time should have no impact on data fetched with fetch"
    ).toBe(initialEcFetch);

    // Wait for EC fetch revalidation.
    await cachePage.waitForTarget(CACHE_TIMINGS.EC_FETCH);

    // First reload - should get stale data.
    await cachePage.reload();
    const staleEcFetch = await cachePage.getEcFetchText();
    expect(staleEcFetch, "EC fetch should show stale data after first reload").toBe(initialEcFetch);

    // Second reload - should get fresh data.
    await cachePage.reload();
    const freshEcFetch = await cachePage.getEcFetchText();
    expect(freshEcFetch, "EC fetch should show fresh data after second reload").not.toBe(
      initialEcFetch
    );

    expect(
      await cachePage.getUnstableCacheText(),
      "Unstable cache should still show cached data"
    ).toBe(initialUnstableCache);

    // Visit page A and verify that data is also updated.
    await cachePage.navigate("a");
    expect(
      await cachePage.getEcFetchText(),
      "EC fetch should show fresh data on Page A since ecFetch has a lower revalidate value"
    ).toBe(freshEcFetch);

    // Wait for unstable cache revalidation.
    await cachePage.waitForTarget(CACHE_TIMINGS.UNSTABLE_CACHE);

    // First reload - should get stale data.
    await cachePage.reload();
    const staleUnstableCache = await cachePage.getUnstableCacheText();
    expect(staleUnstableCache, "Unstable cache should still show stale data").toBe(
      initialUnstableCache
    );

    // Second reload - should get fresh data.
    await cachePage.reload();
    const freshUnstableCache = await cachePage.getUnstableCacheText();
    expect(freshUnstableCache, "Unstable cache should show fresh data").not.toBe(
      initialUnstableCache
    );
  });
});
