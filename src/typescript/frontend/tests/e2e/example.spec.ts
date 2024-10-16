import { test, expect } from "@playwright/test";
import { REVALIDATE_TEST } from "../../src/const";

const sleep = (ms: number) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

const NEXTJS_CACHE_HEADER = "x-nextjs-cache";

test("api test route", async ({ page }) => {
  const numericRegex = /^[0-9]+$/;

  let res1: Response;
  let res1headers: {
    [key: string]: string;
  };

  // Query a first time.
  //
  // We need to do this multiple times until the cache header !== "STALE".
  //
  // This is because NextJS has a "serve stale value while generating new one"
  // caching policy.
  //
  // Since we want a fresh value here, we will query until we get one (which
  // should be two times, since the first one will trigger the revalidation and
  // the second one should get the new result).
  do {
    await sleep(100);
    res1 = await page.goto("/test");
    res1headers = res1.headers();
  } while (res1headers[NEXTJS_CACHE_HEADER] === "STALE");
  const res1text = await res1.text();

  expect(res1text).toMatch(numericRegex);
  expect(res1headers[NEXTJS_CACHE_HEADER]).toMatch("HIT");

  // Query a second time after a second.
  //
  // This should hit cache and be the same value as before.
  await sleep((REVALIDATE_TEST / 2) * 1000);
  const res2 = await page.goto("/test");
  const res2headers = res2.headers();
  const res2text = await res2.text();

  expect(res2text).toBe(res1text);
  expect(res2headers[NEXTJS_CACHE_HEADER]).toBe("HIT");

  // Query a third time after 1200ms.
  //
  // Since this has exceeded the revalidation time of the endpoint, this should
  // have the cache header set to "STALE". Despite that, because of the "serve
  // stale value while generating new one" caching policy, this value should be
  // the same as the previous one.
  await sleep((REVALIDATE_TEST / 2) * 1.2 * 1000);

  const res3 = await page.goto("/test");
  const res3headers = res3.headers();
  const res3text = await res3.text();

  expect(res3headers[NEXTJS_CACHE_HEADER]).toBe("STALE");
  expect(res3text).toMatch(numericRegex);
  expect(res3text).toBe(res2text);

  // Query a fourth time.
  //
  // This should be a cache "HIT", as we will get the cached value generated on
  // the previous request. This should also be different than the previous
  // requests as it is the newly calculated value.
  //
  // We also give 200ms to finish generating the new value.
  await sleep(200);
  const res4 = await page.goto("/test");
  const res4headers = res4.headers();
  const res4text = await res4.text();

  expect(res4headers[NEXTJS_CACHE_HEADER]).toBe("HIT");
  expect(res4text).toMatch(numericRegex);

  expect(BigInt(res1text)).toBeLessThan(BigInt(res4text));
});
