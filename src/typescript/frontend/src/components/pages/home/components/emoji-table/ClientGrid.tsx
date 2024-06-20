import TableCard from "../table-card/TableCard";
import { StyledGrid } from "./styled";
import { type EmojiTableProps } from "./index";

export const ClientGrid = ({ data }: Omit<EmojiTableProps, "totalNumberOfMarkets">) => {
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
