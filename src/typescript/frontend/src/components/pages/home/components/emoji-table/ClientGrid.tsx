import { toCoinDecimalString } from "lib/utils/decimals";
import TableCard from "../table-card";
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
              marketCap={toCoinDecimalString(market.marketCap, 2)}
              volume24h={toCoinDecimalString(market.dailyVolume, 2)}
              key={market.marketID.toString()}
            />
          );
        })}
      </StyledGrid>
    </>
  );
};
