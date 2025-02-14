"use client";

import { useNameResolver } from "@hooks/use-name-resolver";
import AptosIconBlack from "@icons/AptosBlack";
import { formatDisplayName } from "@sdk/utils";
import { type FullCoinData } from "app/wallet/[address]/page";
import { ExplorerLink } from "components/explorer-link/ExplorerLink";
import { Table, TableBody, TableHeader, TableRow } from "components/ui/table";
import { useMemo, useState, type FC } from "react";
import { PortfolioHeader } from "./PortfolioHeader";
import { PortfolioRow } from "./PortfolioRow";

interface Props {
  address: string;
  ownedCoins: FullCoinData[];
  walletStats: {
    totalValue: number;
  };
}

export const WalletClientPage: FC<Props> = ({ address, ownedCoins, walletStats }) => {
  const resolvedName = useNameResolver(address);

  const [sort, setSort] = useState<{ column: string; direction: "asc" | "desc" }>({
    column: "Value",
    direction: "desc",
  });

  const sorted = useMemo(() => {
    if (sort.column === "Value") {
      return ownedCoins.sort(
        (a, b) => (b.ownedValue - a.ownedValue) * (sort.direction === "asc" ? -1 : 1)
      );
    } else if (sort.column === "Amount") {
      return ownedCoins.sort((a, b) => (b.amount - a.amount) * (sort.direction === "asc" ? -1 : 1));
    } else if (sort.column === "Percentage") {
      return ownedCoins.sort(
        (a, b) =>
          (b.ownedValue / walletStats.totalValue - a.ownedValue / walletStats.totalValue) *
          (sort.direction === "asc" ? -1 : 1)
      );
    } else if (sort.column === "Market cap") {
      return ownedCoins.sort(
        (a, b) => (b.marketCap - a.marketCap) * (sort.direction === "asc" ? -1 : 1)
      );
    }
    return ownedCoins;
  }, [sort.column, sort.direction, ownedCoins, walletStats.totalValue]);

  return (
    <>
      <span className="pixel-heading-2">
        Portfolio of{" "}
        <ExplorerLink className="text-ec-blue hover:underline" type="account" value={address}>
          {formatDisplayName(resolvedName)}
        </ExplorerLink>
      </span>
      <div className="flex justify-between w-full mb-4">
        <span className="pixel-heading-3b">
          Total value: {walletStats.totalValue.toFixed(2)}{" "}
          <AptosIconBlack className="icon-inline" />
        </span>
        <span className="pixel-heading-3b">Unique owned: {ownedCoins.length}</span>
      </div>
      <div className="flex justify-center w-full">
        <div>
          <Table className="border-solid border-[1px] border-dark-gray">
            <TableHeader>
              <TableRow isHeader>
                <PortfolioHeader className="w-[100px] justify-center text-center" text={"Emoji"} />
                <PortfolioHeader
                  sort={sort}
                  setSort={setSort}
                  className="w-[160px] text-center justify-center"
                  text="Percentage"
                />
                <PortfolioHeader
                  sort={sort}
                  setSort={setSort}
                  className="w-[100px] text-right justify-end"
                  text="Amount"
                />
                <PortfolioHeader
                  sort={sort}
                  setSort={setSort}
                  className="w-[150px] text-right justify-end"
                  text="Market cap"
                />
                <PortfolioHeader
                  sort={sort}
                  setSort={setSort}
                  className="w-[150px] text-right justify-end"
                  text="USD Value"
                />
                <PortfolioHeader
                  sort={sort}
                  setSort={setSort}
                  className="w-[150px] text-right justify-end"
                  text="Value"
                />
              </TableRow>
            </TableHeader>
            <TableBody>
              {sorted.map((coin) => (
                <PortfolioRow key={coin.symbol} coinData={coin} walletStats={walletStats} />
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </>
  );
};
