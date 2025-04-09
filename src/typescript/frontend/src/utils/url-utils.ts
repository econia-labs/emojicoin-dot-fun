type PrimitiveValue = string | number | boolean | null | undefined;
type SearchParamsRecord = Record<string, PrimitiveValue | PrimitiveValue[]>;

/**
 * Adds search parameters to the URL.
 */
export const addSearchParams = (url: string, searchParams: SearchParamsRecord) => {
  const search = new URLSearchParams();
  Object.entries(searchParams).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    if (Array.isArray(value)) {
      value.forEach((v) => {
        if (v !== undefined && v !== null) {
          search.append(key, String(v));
        }
      });
    } else {
      search.append(key, String(value));
    }
  });

  return search.toString() ? `${url}?${search}` : url;
};

/**
 * Parses URL search parameters into a record that handles multiple values for the same key
 */
export const parseSearchParams = (
  searchParams: URLSearchParams
): Record<string, string | string[]> => {
  const rawParams: Record<string, string | string[]> = {};

  for (const [key, value] of searchParams.entries()) {
    if (key in rawParams) {
      if (Array.isArray(rawParams[key])) {
        (rawParams[key] as string[]).push(value);
      } else {
        rawParams[key] = [rawParams[key] as string, value];
      }
    } else {
      rawParams[key] = value;
    }
  }

  return rawParams;
};
