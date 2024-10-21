import { getDbConnection } from "../helpers";
import { fetchPriceFeed } from "../../../src/indexer-v2/queries";

// We need a long timeout because the test must wait for the 1-minute period to expire.
jest.setTimeout(750000);

describe("queries price_feed and returns accurate price feed data", () => {
  it("checks price feed results generated from artificial data", async () => {
    const db = getDbConnection();
    // Insert a swap 25 hours ago at price 500
    await db`insert into swap_events values (
      1,
      '1',
      '1',
      now() - interval '1 day 1 hour',
      now() - interval '1 day 1 hour',

      -- Market and state metadata.
      777701,
      '\\xDEADBEEF'::bytea,
      '{""}',
      now() - interval '1 day 1 hour',
      1,
      'swap_buy',
      '',

      -- Swap event data.
      '',
      '',
      0,
      0,
      false,
      0,
      0,
      500000000000000,
      100000000000000,
      9223372036854775808000,
      0,
      false,
      false,

      -- State event data.
      0,
      0,
      0,
      0,
      0,
      500000000000000,
      100000000000000,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0
    )`;
    // Insert a fresh swap at price 750
    await db`insert into swap_events values (
      2,
      '1',
      '1',
      now(),
      now(),

      -- Market and state metadata.
      777701,
      '\\xDEADBEEF'::bytea,
      '{""}',
      now(),
      2,
      'swap_buy',
      '',

      -- Swap event data.
      '',
      '',
      0,
      0,
      false,
      0,
      0,
      750000000000000,
      100000000000000,
      13835058055282163712000,
      0,
      false,
      false,

      -- State event data.
      0,
      0,
      0,
      0,
      0,
      1250000000000000,
      200000000000000,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0
    )`;
    // Update market_latest_state_event accordingly
    await db`insert into market_latest_state_event values (
      2,
      '1',
      '1',
      now(),
      now(),

      -- Market and state metadata.
      777701,
      '\\xDEADBEEF'::bytea,
      '{""}',
      now() - interval '1 day 1 hour',
      2,
      'swap_buy',
      '',

      -- State event data.
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      false,
      13835058055282163712000,
      0,
      0,
      0,
      now(),

      0,
      false,
      500000000000000
    )`;

    const priceFeed = await fetchPriceFeed({});
    expect(priceFeed[0].marketID).toEqual(777701);
    expect(priceFeed[0].openPrice).toEqual(500);
    expect(priceFeed[0].closePrice).toEqual(750);
  });
});
