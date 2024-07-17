import TableCard from "../table-card/TableCard";
import { StyledGrid } from "./styled";
import type { FetchSortedMarketDataReturn } from "lib/queries/sorting/market-data";

export const ClientGrid = ({ data }: {data: FetchSortedMarketDataReturn["markets"]}) => {
  return (
    <>
      <StyledGrid>
        {data.map((market) => {
          return (
            <TableCard
              {...market}
              staticMarketCap={market.marketCap.toString()}
              staticVolume24H={market.dailyVolume.toString()}
              staticNumSwaps={market.numSwaps.toString()}
              key={market.marketID.toString()}
            />
          );
        })}
      </StyledGrid>
    </>
  );
};
