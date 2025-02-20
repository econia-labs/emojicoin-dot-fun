"use client";

import { useNameResolver } from "@hooks/use-name-resolver";
import AptosIconBlack from "@icons/AptosBlack";
import { formatDisplayName } from "@sdk/utils";
import { type FullCoinData } from "app/wallet/[address]/page";
import { ExplorerLink } from "components/explorer-link/ExplorerLink";
import _ from "lodash";
import { type FC } from "react";
import { PortfolioRow } from "./PortfolioRow";
import { FormattedNumber } from "components/FormattedNumber";
import { EcTable, type EcTableColumn } from "components/ui/table/ecTable";

interface Props {
  address: string;
  ownedCoins: FullCoinData[];
  walletStats: {
    totalValue: number;
  };
}

const COLUMNS: EcTableColumn<FullCoinData>[] = [
  { id: "emoji", text: "Emoji", width: 80 },
  {
    id: "percentage",
    text: "Percentage",
    width: 130,
    sortCallback: (coin) => coin.percentage,
  },
  {
    id: "amount",
    text: "Amount",
    width: 110,
    sortCallback: (coin) => coin.amount,
  },
  {
    id: "marketCap",
    text: "Market cap",
    width: 150,
    sortCallback: (coin) => coin.marketCap,
  },
  {
    id: "usdValue",
    text: "USD Value",
    width: 120,
    sortCallback: (coin) => coin.ownedValue,
  },
  {
    id: "ownedValue",
    text: "Value",
    width: 110,
    sortCallback: (coin) => coin.ownedValue,
  },
];

export const WalletClientPage: FC<Props> = ({ address, ownedCoins, walletStats }) => {
  const resolvedName = useNameResolver(address);

  return (
    <>
      <span className="pixel-heading-2">
        Portfolio of{" "}
        <ExplorerLink className="text-ec-blue hover:underline" type="account" value={address}>
          {formatDisplayName(resolvedName, { noTruncateANSName: true })}
        </ExplorerLink>
      </span>
      <div className="flex justify-between w-full mb-4">
        <span className="pixel-heading-3b">
          Total value:{" "}
          <FormattedNumber scramble value={walletStats.totalValue} style="sliding-precision" />
          <AptosIconBlack className="icon-inline" />
        </span>
        <span className="pixel-heading-3b">Unique owned: {ownedCoins.length}</span>
      </div>
      <div className="w-full overflow-x-auto">
        <EcTable
          className="flex mobile-sm:max-w-[calc(100vw-20px)] sm:max-w-[80vw] max-h-[calc(100vh-300px)] m-auto overflow-auto shadow-[0_0_0_1px_var(--dark-gray)]"
          columns={COLUMNS}
          items={ownedCoins}
          getKey={(coin) => coin.asset_type}
          renderRow={(item, i) => (
            <PortfolioRow key={item.symbol} index={i} coinData={item} walletStats={walletStats} />
          )}
        />
      </div>
    </>
  );
};
