"use client";

import { useNameResolver } from "@hooks/use-name-resolver";
import AptosIconBlack from "@icons/AptosBlack";
import { formatDisplayName } from "@sdk/utils";
import { ExplorerLink } from "components/explorer-link/ExplorerLink";
import { PortfolioRow } from "./PortfolioRow";
import { FormattedNumber } from "components/FormattedNumber";
import { EcTable, type EcTableColumn } from "components/ui/table/ecTable";
import {
  type FullCoinData,
  useUserEmojicoinBalances,
} from "lib/hooks/queries/use-fetch-owner-emojicoin-balances";
import AnimatedLoadingBoxes from "../launch-emojicoin/animated-loading-boxes";
import { cn } from "lib/utils/class-name";

const COLUMNS: EcTableColumn<FullCoinData>[] = [
  { id: "emoji", text: "Emoji", width: 80 },
  {
    id: "percentage",
    text: "percent",
    width: 105,
    sortCallback: (coin) => coin.percentage,
  },
  {
    id: "amount",
    text: "Amount",
    width: 130,
    sortCallback: (coin) => coin.amount,
  },
  {
    id: "marketCap",
    text: "Market cap",
    width: 145,
    sortCallback: (coin) => coin.marketCap,
  },
  {
    id: "usdValue",
    text: "USD Value",
    width: 130,
    sortCallback: (coin) => coin.ownedValue,
  },
  {
    id: "ownedValue",
    text: "Value",
    width: 110,
    sortCallback: (coin) => coin.ownedValue,
  },
];

export const WalletClientPage = ({ address }: { address: string }) => {
  const { ownedCoins, totalValue, isLoading } = useUserEmojicoinBalances(address);
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
          {"Total value: "}
          {isLoading ? (
            <>{"???"}</>
          ) : (
            <>
              <FormattedNumber scramble value={totalValue} style="sliding-precision" />
              <AptosIconBlack className="icon-inline ml-[2px]" />
            </>
          )}
        </span>
        <span className="pixel-heading-3b">
          Unique owned: {isLoading ? "?" : ownedCoins.length}
        </span>
      </div>
      <div className="w-full overflow-x-auto">
        {isLoading ? (
          <div className="flex mobile-sm:min-w-[calc(100vw-20px)] sm:min-w-[80vw] md:min-w-[700px] h-[100px]">
            <div className="flex m-auto">
              <AnimatedLoadingBoxes numSquares={11} />
            </div>
          </div>
        ) : (
          <EcTable
            className={cn(
              "flex mobile-sm:max-w-[calc(100vw-20px)] sm:max-w-[80vw] h-[60dvh] m-auto",
              "overflow-auto shadow-[0_0_0_1px_var(--dark-gray)]"
            )}
            columns={COLUMNS}
            items={ownedCoins}
            getKey={(coin) => coin.symbol}
            renderRow={(item, i) => (
              <PortfolioRow key={item.symbol} index={i} coinData={item} totalValue={totalValue} />
            )}
          />
        )}
      </div>
    </>
  );
};
