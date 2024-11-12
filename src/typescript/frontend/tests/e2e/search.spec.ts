import { test, expect } from "@playwright/test";
import { EmojicoinClient } from "../../../sdk/src/client/emojicoin-client";
import { getFundedAccount } from "../../../sdk/src/utils/test/test-accounts";
import { SYMBOL_EMOJI_DATA } from "../../../sdk/src";

test("check search results", async ({ page }) => {
  const user = getFundedAccount("666");
  const cat = SYMBOL_EMOJI_DATA.byName("cat")!.emoji;
  const symbols = [cat, cat];

  const client = new EmojicoinClient();
  // Register the market if it doesn't exist- it should only exist if the test is retried.
  const exists = await client.view.marketExists(symbols);
  if (!exists) {
    await client.register(user, symbols);
  }

  await page.goto("/home");

  // Click the search field.
  const search = page.getByTestId("emoji-input");
  expect(search).toBeVisible();
  await search.click();

  // Expect the emoji picker to be visible.
  const picker = page.getByTestId("picker");
  expect(picker).toBeVisible();

  // Search for "cat" in the emoji picker search field.
  const emojiSearch = page.getByPlaceholder("Search");
  expect(emojiSearch).toBeVisible();
  await emojiSearch.fill("cat");

  // Expect the "cat" emoji to be visible in the search results.
  // Note: we must use `getByRole` with 'button' because this element is in the picker shadow DOM.
  let emojiSearchCatButton = picker.getByRole("button", { name: cat, exact: true });
  expect(emojiSearchCatButton).toBeVisible();

  // Search for the cat,cat market by clicking twice.
  await emojiSearchCatButton.click({ force: true, clickCount: 2 });

  // Click on the cat,cat market.
  const marketCard = page.getByText("cat,cat", { exact: true });
  expect(marketCard).toBeVisible();
  await marketCard.click();

  // Expect to be redirected to the cat,cat market.
  await expect(page).toHaveURL(/.*cat;cat/);
});
