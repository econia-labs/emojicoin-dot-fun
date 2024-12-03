import { calculateDeltaPercentageForQ64s } from "../../src/indexer-v2/types";
import { toQ64Big } from "../../src/utils/nominal-price";

describe("tests the delta percentage calculations", () => {
  it("calculates the delta percentage accurately", () => {
    const inputs = [
      [100, 500, 400],
      [100, 50, -50],
      [100, 10, -90],
      [100, 1, -99],
      [100, 0.1, -99.9],
      [100, 0.01, -99.99],
      [1, 10, 900],
      [1, 16, 1500],
      [10, 160, 1500],
      [160, 10, -93.75],
      [16, 1, -93.75],
      [100, 175, 75],
      [100, 75, -25],
      [100, 25, -75],
    ];

    for (const [open, close, expectedPercentage] of inputs) {
      const [openQ64, closeQ64] = [toQ64Big(open).toString(), toQ64Big(close).toString()];
      const receivedPercentage = calculateDeltaPercentageForQ64s(openQ64, closeQ64);
      expect(receivedPercentage).toEqual(expectedPercentage);
    }
  });
});
