import { test, expect } from "@playwright/test";
import { EmojicoinClient } from "../../../sdk/src/client/emojicoin-client";
import { getFundedAccount } from "../../../sdk/src/utils/test/test-accounts";
import { SYMBOL_EMOJI_DATA } from "../../../sdk/src";

test("check search results", async ({ page }) => {
  const user = getFundedAccount("666");
  const symbols = [SYMBOL_EMOJI_DATA.byName("cat")!.emoji, SYMBOL_EMOJI_DATA.byName("cat")!.emoji];
  const client = new EmojicoinClient();
  await client.register(user, symbols).then((res) => res.handle);

  await page.goto("/home");

  const search = page.getByTestId("emoji-input");
  expect(search).toBeVisible();
  await search.fill(symbols.join(""));

  const marketCard = page.getByText("cat,cat", { exact: true });
  expect(marketCard).toBeVisible();
  await marketCard.click();

  await expect(page).toHaveURL(/.*cat;cat/);
});
