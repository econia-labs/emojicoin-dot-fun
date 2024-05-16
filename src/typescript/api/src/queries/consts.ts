export const INBOX_URL = (() => {
  let res: string;
  const envUrl = process.env.NEXT_PUBLIC_INBOX_URL ?? process.env.INBOX_URL;
  if (!envUrl) {
    res = "http://localhost:3000";
  } else {
    res = envUrl;
  }
  return res;
})();
export const TABLE_NAME = "inbox_events";
export const LIMIT = 100;
export const DESCENDING = {
  ascending: false,
};
export const ASCENDING = {
  ascending: true,
};
export const ORDER_BY = {
  DESC: DESCENDING,
  ASC: ASCENDING,
};
