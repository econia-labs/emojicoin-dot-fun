import "server-only";

export const INBOX_EVENTS_TABLE = "inbox_events";
export const MARKET_DATA_VIEW = "market_data";
export const INBOX_LATEST_STATE = "inbox_latest_state";
export const INBOX_VOLUME = "inbox_volume";
export const LIMIT = 500;
export const ORDER_BY = {
  DESC: {
    ascending: false as const,
  },
  ASC: {
    ascending: true as const,
  },
};
