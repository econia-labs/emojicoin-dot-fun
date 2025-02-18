import { chunk } from "../../src";

describe("tests simple chunk functionality", () => {
  it("chunks a simple array correctly", () => {
    const arr = [1, 2, 3, 4, 5, 6, 7, 8, 9, 8, 7, 6, 5];
    expect(chunk(arr, 5)).toEqual([
      [1, 2, 3, 4, 5],
      [6, 7, 8, 9, 8],
      [7, 6, 5],
    ]);
    expect(arr.length).toBe(0);
  });

  it("chunks an empty array correctly", () => {
    const arr: number[] = [];
    expect(chunk(arr, 2)).toEqual([]);
    expect(arr.length).toBe(0);
  });

  it("chunks an array of size one correctly", () => {
    const arr = [10];
    expect(chunk(arr, 5)).toEqual([[10]]);
    expect(arr.length).toBe(0);
  });

  it("chunks an array with an input size greater than the array correctly", () => {
    const arr = [1, 2, 3, 4, 5];
    expect(chunk(arr, 6)).toEqual([[1, 2, 3, 4, 5]]);
    expect(arr.length).toBe(0);
  });

  it("chunks lots of single values correctly", () => {
    const arr = [1, 2, 3, 4, 5, 6, 7, 8, 9];
    expect(chunk(arr, 1)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9].map((v) => [v]));
    expect(arr.length).toBe(0);
  });
});
