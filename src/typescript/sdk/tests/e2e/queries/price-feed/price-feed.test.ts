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
    const market_777701 = priceFeed.find((m) => m.marketID === 777701n);
    expect(market_777701).toBeDefined();
    expect(market_777701!.marketID).toEqual(777701n);
    expect(market_777701!.openPrice).toEqual(500n);
    expect(market_777701!.closePrice).toEqual(750n);
    expect(market_777701!.deltaPercentage).toEqual(50);

    const market_777702 = priceFeed.find((m) => m.marketID === 777702n);
    expect(market_777702).toBeDefined();
    expect(market_777702!.marketID).toEqual(777702n);
    expect(market_777702!.openPrice).toEqual(1000n);
    expect(market_777702!.closePrice).toEqual(250n);
    expect(market_777702!.deltaPercentage).toEqual(-75);
  });
});
