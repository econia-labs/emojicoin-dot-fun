import * as validation from "../../src/utils/validation";

describe("validation utility functions", () => {
  it("should trim leading zeros", () => {
    const givenAndExpected = [
      ["00", "0"],
      ["00000000", "0"],
      ["01", "1"],
      ["001", "1"],
      ["000000001", "1"],
      ["00.1", "0.1"],
      ["00000000.1", "0.1"],
      ["01.1", "1.1"],
      ["001.1", "1.1"],
      ["000000001.1", "1.1"],
      ["0.1", "0.1"],
      ["10", "10"],
      ["100", "100"],
    ];

    givenAndExpected.forEach(([given, expected]) => {
      expect(validation.trimLeadingZeros(given)).toEqual(expected);
    });
  });

  it("should sanitize number", () => {
    const givenAndExpected = [
      [",1", "0.1"],
      [",0", "0.0"],
      ["0,1", "0.1"],
      ["0,0", "0.0"],
      [",100", "0.100"],
      [",000", "0.000"],
      ["0000,0", "0.0"],
      ["0000,001", "0.001"],
    ];

    givenAndExpected.forEach(([given, expected]) => {
      expect(validation.sanitizeNumber(given)).toEqual(expected);
    });
  });

  it("should accurately test if number is in contruction", () => {
    const givenAndExpected: [string, boolean][] = [
      [".0", true],
      [".1", true],
      ["0.0", true],
      ["0.1", true],
      ["1.0", true],
      ["1.1", true],
      ["0", true],
      ["0.000", true],
      ["0.", true],
      ["1.", true],
      ["0.0.1", false],
      ["0.abc", false],
      ["abc.0", false],
    ];

    givenAndExpected.forEach(([given, expected]) => {
      expect(validation.isNumberInContstruction(given)).toEqual(expected);
    });
  });

  it("should accurately return the number of decimals", () => {
    const givenAndExpected: [string, number][] = [
      ["0", 0],
      ["0.", 0],
      [".0", 1],
      ["0.0", 1],
      ["0.00", 2],
      ["00.00", 2],
      ["000.00", 2],
      ["0.0001", 4],
      [".0001", 4],
      ["54423536.23466245", 8],
      [".23466245", 8],
    ];

    givenAndExpected.forEach(([given, expected]) => {
      expect(validation.numberOfDecimals(given)).toEqual(expected);
    });
  });
});
