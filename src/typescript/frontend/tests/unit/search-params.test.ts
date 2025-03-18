import { addSearchParams } from "../../src/utils/url-utils";

describe("addSearchParams", () => {
  it("should add search parameters to a URL", () => {
    const url = "https://example.com";
    const params = { foo: "bar", baz: 123 };
    const result = addSearchParams(url, params);
    expect(result).toBe("https://example.com?foo=bar&baz=123");
  });

  it("should handle array values", () => {
    const url = "https://example.com";
    const params = { tags: ["react", "typescript", "javascript"] };
    const result = addSearchParams(url, params);
    expect(result).toBe("https://example.com?tags=react&tags=typescript&tags=javascript");
  });

  it("should skip null and undefined values", () => {
    const url = "https://example.com";
    const params = {
      name: "John",
      age: 30,
      email: null,
      phone: undefined,
      status: "",
    };
    const result = addSearchParams(url, params);
    expect(result).toBe("https://example.com?name=John&age=30&status=");
  });

  it("should not add a question mark if there are no parameters", () => {
    const url = "https://example.com";
    const params = {
      hidden: null,
      empty: undefined,
    };
    const result = addSearchParams(url, params);
    expect(result).toBe("https://example.com");
  });

  it("should handle mixed array values and skip null/undefined array items", () => {
    const url = "https://example.com";
    const params = {
      id: [123, null, 456, undefined, 789],
    };
    const result = addSearchParams(url, params);
    expect(result).toBe("https://example.com?id=123&id=456&id=789");
  });

  it("should handle boolean values", () => {
    const url = "https://example.com";
    const params = {
      active: true,
      archived: false,
    };
    const result = addSearchParams(url, params);
    expect(result).toBe("https://example.com?active=true&archived=false");
  });
});
