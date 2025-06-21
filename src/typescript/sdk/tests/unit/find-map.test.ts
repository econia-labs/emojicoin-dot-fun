import { findMap } from "../../src/utils/misc";

describe("findMap", () => {
  it("returns undefined for an empty array", () => {
    const input: number[] = [];
    const result = findMap(input, (x) => (x > 0 ? x : undefined));
    expect(result).toBeUndefined();
  });

  it("returns the first mapped non-undefined value", () => {
    const input = [1, 2, 3, 4];
    const result = findMap(input, (x) => (x % 2 === 0 ? `even-${x}` : undefined));
    expect(result).toBe("even-2");
  });

  it("returns undefined if no value maps to non-undefined", () => {
    const input = [1, 3, 5];
    const result = findMap(input, (x) => (x % 2 === 0 ? `even-${x}` : undefined));
    expect(result).toBeUndefined();
  });

  it("works with strings and returns transformed first match", () => {
    const input = ["a", "b", "c"];
    const result = findMap(input, (s) => (s === "b" ? s.toUpperCase() : undefined));
    expect(result).toBe("B");
  });

  it("returns first truthy non-undefined result even if later ones also match", () => {
    const input = [10, 20, 30];
    const result = findMap(input, (x) => (x >= 20 ? `match-${x}` : undefined));
    expect(result).toBe("match-20");
  });
});
