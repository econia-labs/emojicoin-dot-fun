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
import { EcTable } from "components/ui/table/ecTable";

interface Props {
  address: string;
  ownedCoins: FullCoinData[];
  walletStats: {
    totalValue: number;
  };
}

const COLUMNS = [
  { id: "emoji", text: "Emoji", className: "w-[160px] text-start justify-start" },
  {
    id: "percentage",
    text: "Percentage",
    className: "w-[160px] text-center justify-center",
    sortCallback: (coin: FullCoinData) => coin.percentage,
  },
  {
    id: "amount",
    text: "Amount",
    className: "w-[100px] text-right justify-end",
    sortCallback: (coin: FullCoinData) => coin.amount,
  },
  {
    id: "marketCap",
    text: "Market cap",
    className: "w-[150px] text-right justify-end",
    sortCallback: (coin: FullCoinData) => coin.marketCap,
  },
  {
    id: "usdValue",
    text: "USD Value",
    className: "w-[150px] text-right justify-end",
    sortCallback: (coin: FullCoinData) => coin.ownedValue,
  },
  {
    id: "ownedValue",
    text: "Value",
    className: "w-[150px] text-right justify-end",
    sortCallback: (coin: FullCoinData) => coin.ownedValue,
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
        <div className="flex mobile-sm:max-w-[calc(100vw-20px)] sm:max-w-[80vw] max-h-[calc(100vh-300px)] m-auto overflow-auto shadow-[0_0_0_1px_var(--dark-gray)]">
          <EcTable
            getId={(coin) => coin.asset_type}
            columns={COLUMNS}
            items={ownedCoins}
            renderRow={(item) => (
              <PortfolioRow key={item.symbol} coinData={item} walletStats={walletStats} />
            )}
          />
        </div>
      </div>
    </>
  );
};
