import { ensureTypeTagStruct } from "../../src";

describe("type tag struct idempotency", () => {
  it("tests a type tag with and without a leading zero", () => {
    const coinType =
      "0xa067cba8d5ed29b0b12bc32037cc46d257568bde578b669e377929996a03ed::coin_factory::Emojicoin";
    const coinTypeWithLeadingZero =
      "0x00a067cba8d5ed29b0b12bc32037cc46d257568bde578b669e377929996a03ed::coin_factory::Emojicoin";
    const ensured = ensureTypeTagStruct(coinType);
    const ensured2 = ensureTypeTagStruct(coinTypeWithLeadingZero);
    expect(ensured.toString()).toEqual(ensured2.toString());
  });
});
