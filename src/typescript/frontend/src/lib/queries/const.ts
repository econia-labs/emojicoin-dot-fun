/**
 * The revalidation time for different various queries, based on the calling
 * component and the data being fetched.
 *
 * Nominal values are in seconds.
 *
 * For example, if the revalidation time is set to 10 seconds, the query will
 * only fetch new data if 10 seconds have passed since the last fetch.
 */
export const REVALIDATIONS = {
  CHARTS: {
    MARKET_DATA: 10,
  },
};
