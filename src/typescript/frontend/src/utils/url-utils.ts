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
