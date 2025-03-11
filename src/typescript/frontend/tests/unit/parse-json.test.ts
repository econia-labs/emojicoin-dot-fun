import { parseJSON, stringifyJSON } from "utils";
import { ArenaCandlestickModel, toArenaCandlestickModel } from "../../../sdk/src";
import { type DatabaseJsonType } from "../../../sdk/src";

// NOTE: These currently don't properly serialize/deserialize Uint8Arrays.
//       Those should be added at some point, as they're used as emoji hex bytes frequently.
describe("json parse and stringify tests", () => {
  it("parses => stringifies => parses json correctly", () => {
    const text = `
        {
          "my_thing": "12",
          "my_other": "wahoo!",
          "bool": true,
          "bool2": false,
          "my_number": 10,
          "okie": [10, "ok!", 3, false, "boo"]
        }
    `;
    const obj = {
      my_thing: "12",
      my_other: "wahoo!",
      bool: true,
      bool2: false,
      my_number: 10,
      okie: [10, "ok!", 3, false, "boo"],
    };
    expect(parseJSON(text)).toEqual(obj);
    const stringified = stringifyJSON(obj);
    const parsedAgain = parseJSON<typeof obj>(stringified);
    expect(parsedAgain).toEqual(obj);
  });

  it("parsed => stringifies => parses json bigints correctly", () => {
    const text = `
        [
          "1n", "2n", "3n", "100n",
          "-1283745628562348957895435783956219852879562357562349875n",
          {
            "my_bigint": "100n",
            "my_not_bigint": "100",
            "my_not_bigint_again": 100
          }
        ]
      `;
    const obj = [
      1n,
      2n,
      3n,
      100n,
      -1283745628562348957895435783956219852879562357562349875n,
      {
        my_bigint: 100n,
        my_not_bigint: "100",
        my_not_bigint_again: 100,
      },
    ];
    expect(parseJSON(text)).toEqual(obj);
    const stringified = stringifyJSON(obj);
    const parsedAgain = parseJSON<typeof obj>(stringified);
    expect(parsedAgain).toEqual(obj);
  });

  it("parses => stringifies => parses json dates correctly", () => {
    const text = `
        [
          "2000-01-01T00:00:00.000Z",
          "1999-12-31T23:59:59.999Z",
          "1970-01-01T00:00:00.000Z",
          "1970-01-01T00:00:00.0000Z",
          "1970-01-01T00:00:00.00000Z",
          "1970-01-01T00:00:00.000000Z",
          "1970-01-01T00:00:00.000001Z",
          "1970-01-01T00:00:00.100001Z",
          "1970-01-01T00:00:00.900009Z",
          "2050-07-15T12:34:56.789Z",
          "1985-06-24T15:45:30.500Z",
          "2012-02-29T23:59:59.999Z",
          "2088-12-12T08:08:08.808Z",
          "1969-07-20T20:17:40Z"
        ]
        `;
    const obj = [
      new Date("2000-01-01T00:00:00.000Z"),
      new Date("1999-12-31T23:59:59.999Z"),
      new Date("1970-01-01T00:00:00.000Z"),
      new Date("1970-01-01T00:00:00.0000Z"),
      new Date("1970-01-01T00:00:00.00000Z"),
      new Date("1970-01-01T00:00:00.000000Z"),
      new Date("1970-01-01T00:00:00.000001Z"),
      new Date("1970-01-01T00:00:00.100001Z"),
      new Date("1970-01-01T00:00:00.900009Z"),
      new Date("2050-07-15T12:34:56.789Z"),
      new Date("1985-06-24T15:45:30.500Z"),
      new Date("2012-02-29T23:59:59.999Z"),
      new Date("2088-12-12T08:08:08.808Z"),
      new Date("1969-07-20T20:17:40Z"),
    ];
    const parseAndMap = (v: string): number[] =>
      parseJSON<Date[]>(v).map((vv) => (vv as Date).getTime());
    expect(parseAndMap(text)).toEqual(obj.map((v) => v.getTime()));
    const stringified = stringifyJSON(obj);
    const parsedAgain = parseAndMap(stringified);
    expect(parsedAgain).toEqual(obj.map((v) => v.getTime()));
  });

  it("parses and stringifies example contract data correctly", () => {
    const candlestick: DatabaseJsonType["arena_candlesticks"] = {
      melee_id: "63",
      last_transaction_version: "6648021205",
      volume: "232970210",
      period: "period_1h",
      start_time: "2025-03-10T20:00:00.000Z",
      open_price: 0.9577325410243456,
      close_price: 0.9630937259248854,
      high_price: 0.9630937259248854,
      low_price: 0.9577325410243456,
      n_swaps: "2",
    };
    const stringified = stringifyJSON(candlestick);
    const parsed = parseJSON<typeof candlestick>(stringified);
    expect(parsed).toEqual({
      ...candlestick,
      start_time: new Date(candlestick.start_time),
    });

    const model = toArenaCandlestickModel(candlestick);
    const stringifiedModel = stringifyJSON(model);
    const parsedModel = parseJSON<ArenaCandlestickModel>(stringifiedModel);
    expect(parsedModel).toEqual(model);
  });
});
