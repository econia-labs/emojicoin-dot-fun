import { extractFilter } from "../../src/utils";

jest.setTimeout(20000);

describe("tests the extractFilter function", () => {
  it("tests basic input", () => {
    type Even = number;
    const isEven = (n: number): n is Even => n % 2 === 0;
    const input = [1, 2, 3, 4, 5, 6];
    const evens = extractFilter(input, isEven);
    expect(input).toEqual([1, 3, 5]);
    expect(evens).toEqual([2, 4, 6]);
  });

  it("tests more complex input", () => {
    type StuckInTheMiddle = `${string}stuck${string}`;
    const isStuckInTheMiddle = (str: string): str is StuckInTheMiddle =>
      !!str.match(/^.+stuck.+$/)?.at(0);
    const input = [
      ".stuck.",
      "stuck.",
      ".stuck",
      "1stuck1",
      "1stuck2",
      "2stuck1",
      "1stuck1",
      "1stuck",
    ];
    const stuck = extractFilter(input, isStuckInTheMiddle);
    expect(input).toEqual(["stuck.", ".stuck", "1stuck"]);
    expect(stuck).toEqual([".stuck.", "1stuck1", "1stuck2", "2stuck1", "1stuck1"]);
  });

  it("handles an empty array", () => {
    const input: number[] = [];
    const result = extractFilter(input, (n): n is number => n > 0);
    expect(input).toEqual([]);
    expect(result).toEqual([]);
  });

  it("handles an array where all elements match the filter", () => {
    const input = [2, 4, 6, 8, 10];
    const result = extractFilter(input, (n): n is number => n % 2 === 0);
    expect(input).toEqual([]);
    expect(result).toEqual([2, 4, 6, 8, 10]);
  });

  it("handles an array where no elements match the filter", () => {
    const input = [1, 3, 5, 7, 9];
    const result = extractFilter(input, (n): n is number => n % 2 === 0);
    expect(input).toEqual([1, 3, 5, 7, 9]);
    expect(result).toEqual([]);
  });

  it("works with objects and preserves reference equality", () => {
    type Person = { name: string; age: number };
    const isAdult = (p: Person): p is Person & { age: number } => p.age >= 18;

    const person1 = { name: "Alice", age: 25 };
    const person2 = { name: "Bob", age: 17 };
    const person3 = { name: "Charlie", age: 30 };

    const input = [person1, person2, person3];
    const adults = extractFilter(input, isAdult);

    expect(input).toEqual([{ name: "Bob", age: 17 }]);
    expect(adults).toEqual([
      { name: "Alice", age: 25 },
      { name: "Charlie", age: 30 },
    ]);

    expect(adults[0]).toBe(person1);
    expect(adults[1]).toBe(person3);
  });

  it("handles large arrays", () => {
    const largeArray = Array.from({ length: 100000000 }, (_, i) => i);
    const isEven = (n: number): n is number => n % 2 === 0;
    const evens = extractFilter(largeArray, isEven);
    expect(largeArray.length).toBe(50000000);
    expect(evens.length).toBe(50000000);
    expect(largeArray[0]).toBe(1);
    expect(evens[0]).toBe(0);
    expect(largeArray.at(-1)).toEqual(100000000 - 1);
    expect(evens.at(-1)).toEqual(100000000 - 2);
  });

  it("correctly handles first and last elements", () => {
    const input = [1, 2, 3, 4, 5];
    const isOdd = (n: number): n is number => n % 2 !== 0;
    const result = extractFilter(input, isOdd);

    expect(input).toEqual([2, 4]);
    expect(result).toEqual([1, 3, 5]);
    expect(input[0]).toBe(2); // First element of remaining array.
    expect(result[0]).toBe(1); // First element of extracted array.
    expect(input[input.length - 1]).toBe(4); // Last element of remaining array.
    expect(result[result.length - 1]).toBe(5); // Last element of extracted array.
  });

  it("correctly handles array with only one element", () => {
    const input = [42];
    const isEven = (n: number): n is number => n % 2 === 0;
    const result = extractFilter(input, isEven);

    expect(input).toEqual([]);
    expect(result).toEqual([42]);
  });

  it("correctly handles array where only first and last elements match filter", () => {
    const input = [1, 2, 3, 4, 5];
    const isOdd = (n: number): n is number => n % 2 !== 0;
    const result = extractFilter(input, (n) => isOdd(n) && (n === 1 || n === 5));

    expect(input).toEqual([2, 3, 4]);
    expect(result).toEqual([1, 5]);
  });

  it("maintains correct order when all elements match filter", () => {
    const input = [1, 3, 5, 7, 9];
    const isOdd = (n: number): n is number => n % 2 !== 0;
    const result = extractFilter(input, isOdd);

    expect(input).toEqual([]);
    expect(result).toEqual([1, 3, 5, 7, 9]);
  });

  it("maintains correct order when no elements match filter", () => {
    const input = [2, 4, 6, 8, 10];
    const isOdd = (n: number): n is number => n % 2 !== 0;
    const result = extractFilter(input, isOdd);

    expect(input).toEqual([2, 4, 6, 8, 10]);
    expect(result).toEqual([]);
  });
});
