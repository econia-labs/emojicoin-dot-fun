"use client";

import { useNameResolver } from "@hooks/use-name-resolver";
import AptosIconBlack from "@icons/AptosBlack";
import { formatDisplayName } from "@sdk/utils";
import { type FullCoinData } from "app/wallet/[address]/page";
import { ExplorerLink } from "components/explorer-link/ExplorerLink";
import { Table, TableBody, TableHead, TableHeader, TableRow } from "components/ui/table";
import { type FC } from "react";
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

  return (
    <>
      <span className="pixel-heading-2">
        Portfolio of{" "}
        <ExplorerLink className="text-ec-blue hover:underline" type="account" value={address}>
          {formatDisplayName(resolvedName)}
        </ExplorerLink>
      </span>
      <div>
        <span className="display-5">
          Total value: {walletStats.totalValue.toFixed(2)}{" "}
          <AptosIconBlack className="icon-inline" />
        </span>
      </div>
      <div className="flex justify-center w-full">
        <div className="w-[1000px]">
          <Table className="border-solid border-[1px] border-dark-gray">
            <TableHeader>
              <TableRow>
                <TableHead>Emoji</TableHead>
                <TableHead>Name</TableHead>
                <TableHead className="text-center">Portfolio %</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="text-right">Value</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ownedCoins.map((coin) => (
                <PortfolioRow key={coin.symbol} coinData={coin} walletStats={walletStats} />
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </>
  );
};
