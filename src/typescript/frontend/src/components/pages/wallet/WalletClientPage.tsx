"use client";

import { type CoinData } from "app/wallet/[address]/page";
import { type FC } from "react";
import { EmojiCard } from "./EmojiCard";
import { Table, TableBody, TableHead, TableHeader, TableRow } from "components/ui/table";

interface Props {
  ownedCoins: CoinData[];
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
              <TableHead>Amount</TableHead>
              <TableHead>Value</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {ownedCoins.map((coin) => (
              <EmojiCard key={coin.coin_type} coinData={coin} />
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
