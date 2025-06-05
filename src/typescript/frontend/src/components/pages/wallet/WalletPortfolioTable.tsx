import { EcTable, type EcTableColumn } from "components/ui/table/ecTable";
import {
  type FullCoinData,
  useUserEmojicoinBalances,
} from "lib/hooks/queries/use-fetch-owner-emojicoin-balances";

import { PortfolioRow } from "./PortfolioRow";

const COLUMNS: EcTableColumn<FullCoinData>[] = [
  { id: "emoji", headerContent: "Emoji", width: 80 },
  {
    id: "percentage",
    headerContent: "percent",
    width: 105,
    sortFn: (coin) => coin.percentage,
  },
  {
    id: "amount",
    headerContent: "Amount",
    width: 130,
    sortFn: (coin) => coin.amount,
  },
  {
    id: "marketCap",
    headerContent: "Market cap",
    width: 145,
    sortFn: (coin) => coin.marketCap,
  },
  {
    id: "usdValue",
    headerContent: "USD Value",
    width: 130,
    sortFn: (coin) => coin.ownedValue,
  },
  {
    id: "ownedValue",
    headerContent: "Value",
    width: 110,
    sortFn: (coin) => coin.ownedValue,
  },
];

export const WalletPortfolioTable = ({ address }: { address: string }) => {
  const { ownedCoins, totalValue, isLoading } = useUserEmojicoinBalances(address);

  return (
    <EcTable
      className={"h-[60dvh] overflow-auto"}
      columns={COLUMNS}
      defaultSortColumn="ownedValue"
      items={ownedCoins}
      getKey={(coin) => coin.symbol}
      isLoading={isLoading}
      renderRow={(item, i) => (
        <PortfolioRow key={item.symbol} index={i} coinData={item} totalValue={totalValue} />
      )}
    />
  );
};
