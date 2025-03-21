import { isValidAptosName } from "../../src";

describe("ans name validation tests", () => {
  it("returns true for valid names", () => {
    expect(isValidAptosName("primary")).toBe(true);
    expect(isValidAptosName("primary.apt")).toBe(true);
    expect(isValidAptosName("secondary.primary")).toBe(true);
    expect(isValidAptosName("secondary.primary.apt")).toBe(true);
  });

  it("returns false for invalid names", () => {
    expect(isValidAptosName(".")).toBe(false);
    expect(isValidAptosName("")).toBe(false);
    expect(isValidAptosName("..")).toBe(false);
    expect(isValidAptosName(" . ")).toBe(false);
    expect(isValidAptosName(" test ")).toBe(false);
    expect(isValidAptosName(".apt")).toBe(false);
    expect(isValidAptosName(".apt.apt")).toBe(false);
    expect(isValidAptosName(".apt.")).toBe(false);
    expect(isValidAptosName("1")).toBe(false);
    expect(isValidAptosName("1.apt")).toBe(false);
    expect(isValidAptosName("bad.bad.bad")).toBe(false);
    expect(isValidAptosName("-bad-")).toBe(false);
    expect(isValidAptosName("-bad.apt")).toBe(false);
    expect(isValidAptosName("bad-.apt")).toBe(false);
    expect(isValidAptosName("b.a.d.apt")).toBe(false);
  });
});
