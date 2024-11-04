import { test, expect } from "@playwright/test";
import { EmojicoinClient } from "../../../sdk/src/client/emojicoin-client";
import { getFundedAccount } from "../../../sdk/src/utils/test/test-accounts";
import { ONE_APT_BIGINT, sleep, SYMBOL_EMOJI_DATA } from "../../../sdk/src";

test.skip("check sorting order", async ({ page }) => {
  const user = getFundedAccount("777");
  const rat = SYMBOL_EMOJI_DATA.byName("rat")!.emoji;
  const emojis = ["cat", "dog", "eagle", "sauropod"];
  const markets = emojis.map((e) => [rat, SYMBOL_EMOJI_DATA.byName(e)!.emoji]);

  const client = new EmojicoinClient();

  // Register markets.
  // They all start with rat to simplify the search.
  for (let i = 0; i < markets.length; i++) {
    await client.register(user, markets[i]).then((res) => res.handle);
    const amount = ((1n * ONE_APT_BIGINT) / 100n) * BigInt(10 ** (markets.length - i));
    await client.buy(user, markets[i], amount).then((res) => res.handle);
  }

  await page.goto("/home");

  // Click the search field.
  const search = page.getByTestId("emoji-input");
  expect(search).toBeVisible();
  await sleep(2000);
  await search.click();

  // Expect the emoji picker to be visible.
  const picker = page.getByTestId("picker");
  expect(picker).toBeVisible();

  // Search for "rat" in the emoji picker search field.
  const emojiSearch = page.getByPlaceholder("Search");
  expect(emojiSearch).toBeVisible();
  await emojiSearch.fill("rat");

  // Search for the rat market.
  await picker.getByLabel(rat).click();

  // Expect markets.length results, since that's how many we registered.
  let marketGridItems = page.getByTestId("market-grid-item");
  expect(marketGridItems).toHaveCount(markets.length);

  // Expect the sorting button to be visible.
  const filters = page.getByText(/{Sort/);
  expect(filters).toBeVisible();

  // Click the sorting button.
  await filters.click();

  // Expect the sort by daily volume button to be visible.
  const dailyVolume = page.locator("#emoji-grid-header").getByText("24h Volume");
  await dailyVolume.waitFor({ state: "visible", timeout: 5000 });
  expect(dailyVolume).toBeVisible();

  // Sort by daily volume.
  await dailyVolume.click();

  const names = emojis.map((e) => `rat,${e}`);
  const patterns = names.map((e) => new RegExp(e));

  // Expect the markets to be in order of daily volume.
  marketGridItems = page.locator("#emoji-grid a").getByTitle(/RAT,/);
  expect(marketGridItems).toHaveText(patterns);

  // Click the sorting button.
  await filters.click();

  // Expect the sort by bump order button to be visible.
  const bumpOrder = page.locator("#emoji-grid-header").getByText("Bump Order");
  await bumpOrder.waitFor({ state: "visible", timeout: 5000 });
  expect(bumpOrder).toBeVisible();

  // Sort by bump order.
  await bumpOrder.click();

  // Expect the markets to be in bump order.
  marketGridItems = page.locator("#emoji-grid a").getByTitle(/RAT,/);
  await marketGridItems.first().waitFor({ state: "visible", timeout: 5000 });
  expect(marketGridItems.first()).toBeVisible();
  expect(marketGridItems).toHaveText(patterns.reverse());
});
