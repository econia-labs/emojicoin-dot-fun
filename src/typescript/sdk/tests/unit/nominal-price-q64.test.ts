import { toNominalPrice } from "../../src/utils/nominal-price";

describe("checks the nominal price conversion function", () => {
  it("converts a nominal Q64 price to a readable price", () => {
    expect(toNominalPrice(158232345788366n)).toEqual(0.158232345788366);
    expect(toNominalPrice(158232345788366n)).toEqual(0.000008577792653);
  });
});
