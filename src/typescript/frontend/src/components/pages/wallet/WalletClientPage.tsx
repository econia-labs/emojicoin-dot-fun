"use client";

import { type FullCoinData } from "app/wallet/[address]/page";
import { Table, TableBody, TableHead, TableHeader, TableRow } from "components/ui/table";
import { type FC } from "react";
import { EmojiCard } from "./EmojiCard";

interface Props {
  ownedCoins: FullCoinData[];
}

export const WalletClientPage: FC<Props> = ({ ownedCoins }) => {
  return (
    <div className="flex justify-center w-full">
      <div className="w-[1000px]">
        <Table className="border-solid border-[1px] border-dark-gray">
          <TableHeader>
            <TableRow>
              <TableHead>Emoji</TableHead>
              <TableHead>Name</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead className="text-right">Value</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {ownedCoins.map((coin) => (
              <EmojiCard key={coin.symbol} coinData={coin} />
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
