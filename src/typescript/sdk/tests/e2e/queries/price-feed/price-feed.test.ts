import { getDbConnection } from "../../helpers";
import { fetchPriceFeed } from "../../../../src/indexer-v2/queries";

// We need a long timeout because the test must wait for the 1-minute period to expire.
jest.setTimeout(750000);

describe("queries price_feed and returns accurate price feed data", () => {
  it("checks price feed results generated from artificial data", async () => {
    const db = getDbConnection();

    // Insert a swap 25 hours ago at price 500
    await db.file("./insert_past_day_swap.sql");

    // Insert a fresh swap at price 750
    await db.file("./insert_current_day_swap.sql");

    // Update market_latest_state_event accordingly
    await db.file("./insert_market_state.sql");

    const priceFeed = await fetchPriceFeed({});
    expect(priceFeed[0].marketID).toEqual(777701);
    expect(priceFeed[0].openPrice).toEqual(500);
    expect(priceFeed[0].closePrice).toEqual(750);
  });
});
