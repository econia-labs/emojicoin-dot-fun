import { getDbConnection } from "../../helpers";
import { fetchPriceFeed } from "../../../../src/indexer-v2/queries";
import path from "path";

const pathRoot = path.join(__dirname, "./");

describe("queries price_feed and returns accurate price feed data", () => {
  it("checks price feed results generated from artificial data", async () => {
    const db = getDbConnection();

    // Insert a swap 25 hours ago at price 500
    await db.file(`${pathRoot}test_1_insert_past_day_swap.sql`);

    // Insert a fresh swap at price 750
    await db.file(`${pathRoot}test_1_insert_current_day_swap.sql`);

    // Update market_latest_state_event accordingly
    await db.file(`${pathRoot}test_1_insert_market_state.sql`);

    // Insert a swap 10 hours ago at price 1000
    await db.file(`${pathRoot}test_2_insert_earlier_swap.sql`);

    // Insert a fresh swap at price 250
    await db.file(`${pathRoot}test_2_insert_later_swap.sql`);

    // Update market_latest_state_event accordingly
    await db.file(`${pathRoot}test_2_insert_market_state.sql`);

    const priceFeed = await fetchPriceFeed({});
    expect(priceFeed[0].marketID).toEqual(777701);
    expect(priceFeed[0].openPrice).toEqual(500n);
    expect(priceFeed[0].closePrice).toEqual(750n);

    expect(priceFeed[1].marketID).toEqual(777702);
    expect(priceFeed[1].openPrice).toEqual(1000n);
    expect(priceFeed[1].closePrice).toEqual(250n);
  });
});
