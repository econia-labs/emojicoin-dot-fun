export const INBOX_EVENTS_TABLE = "inbox_events";
export const MARKET_DATA_VIEW = "market_data";
export const PERIODIC_STATE_VIEW = "inbox_periodic_states";
export const INBOX_LATEST_STATE = "inbox_latest_state";
export const INBOX_VOLUME = "inbox_volume";
export const INBOX_SWAPS = "inbox_swaps";
export const LIMIT = 100;
export const ORDER_BY = {
  DESC: {
    ascending: false as const,
  },
  ASC: {
    ascending: true as const,
  },
};
export type OrderBy = typeof ORDER_BY[keyof typeof ORDER_BY];

export type OrderByStrings = "asc" | "desc";
export const toOrderBy = (input: OrderByStrings | OrderBy) => {
  if (typeof input !== "string") {
    return input;
  }
  switch (input.toLowerCase()) {
    case "asc":
      return ORDER_BY.ASC;
    case "desc":
      return ORDER_BY.DESC;
    default:
      throw new Error(`Invalid order by value: ${input}`);
  }
};

export const toOrderByString = (
  input: OrderByStrings | OrderBy
): OrderByStrings => {
  if (typeof input === "string") {
    return input;
  }
  switch (input) {
    case ORDER_BY.ASC:
      return "asc";
    case ORDER_BY.DESC:
      return "desc";
    default:
      return "desc";
  }
};
