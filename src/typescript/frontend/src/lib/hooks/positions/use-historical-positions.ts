import { useHistoricalPositionsQuery } from "../queries/arena/use-historical-positions-query";

export const useHistoricalPositions = () => {
  return useHistoricalPositionsQuery();
};
