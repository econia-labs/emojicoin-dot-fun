import { test, expect } from "@playwright/test";
import { EmojicoinClient } from "../../../sdk/src/client/emojicoin-client";
import { getFundedAccount } from "../../../sdk/src/utils/test/test-accounts";
import { ONE_APT_BIGINT, sleep, SYMBOL_EMOJI_DATA } from "../../../sdk/src";

test("check sorting order", async ({ page }) => {
  const user = getFundedAccount("777");
  const rat = SYMBOL_EMOJI_DATA.byName("rat")!.emoji;
  const markets = [
    [rat, SYMBOL_EMOJI_DATA.byName("cat")!.emoji],
    [rat, SYMBOL_EMOJI_DATA.byName("dog")!.emoji],
    [rat, SYMBOL_EMOJI_DATA.byName("eagle")!.emoji],
    [rat, SYMBOL_EMOJI_DATA.byName("sauropod")!.emoji],
  ];

  const client = new EmojicoinClient();

  for (let i = 0; i < markets.length; i++) {
    await client.register(user, markets[i]);
    await client.buy(user, markets[i], 1n * ONE_APT_BIGINT / 100n * BigInt(10 ** (markets.length - i)));
  }

  await page.goto("/home");

  await sleep(10000);

  const search = page.getByTestId("emoji-input");
  expect(search).toBeVisible();
  await search.click();

  const picker = page.getByTestId("picker");
  expect(picker).toBeVisible();

  const emojiSearch = page.getByPlaceholder("Search");
  expect(emojiSearch).toBeVisible();
  await emojiSearch.fill("rat");

  await picker.getByLabel(rat).click();

  let marketGridItems = page.getByTestId("market-grid-item");
  expect(marketGridItems).toHaveCount(markets.length);

  const filters = page.getByText(/{Sort/);
  expect(filters).toBeVisible();

  await filters.click();

  const dailyVolume = page.locator('#emoji-grid-header').getByText('24h Volume');
  expect(dailyVolume).toBeVisible();

  const bumpOrder = page.locator('#emoji-grid-header').getByText('Bump Order');
  expect(bumpOrder).toBeVisible();

  await dailyVolume.click();

  marketGridItems = page.getByTestId("market-grid-item");
  expect(marketGridItems).toHaveText(markets.map(e => new RegExp(e.join(""))));

  await filters.click();
  await bumpOrder.click();

  marketGridItems = page.getByTestId("market-grid-item");
  expect(marketGridItems).toHaveText(markets.map(e => new RegExp(e.join(""))).reverse());
});
