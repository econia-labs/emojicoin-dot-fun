import "server-only";

import { type Types } from "../types";
import { paginateMarketRegistrations } from "./market";

export const getMostRecentMarketEvent = async (): Promise<Types.MarketRegistrationEvent | null> => {
  const { markets } = await paginateMarketRegistrations();
  return markets.length > 0 ? markets[0] : null;
};
