"use client";

import { type CoinData } from "app/wallet/[address]/page";
import { type FC } from "react";
import { EmojiCard } from "./EmojiCard";

interface Props {
  ownedCoins: CoinData[];
}

export const WalletClientPage: FC<Props> = ({ ownedCoins }) => {
  return (
    <div className="flex justify-center w-full">
      {/* <table className="w-[800px]">
        <thead>
          <tr>
            <th>
              <Text>Emoji</Text>
            </th>
            <th>
              <Text>Amount</Text>
            </th>
          </tr>
        </thead>
        <tbody>
          {ownedTokens.map((token) => (
            <tr key={token.coin_type}>
              <td>
                <Text>{token.coin_info?.symbol}</Text>
              </td>
              <td>
                <Text>
                  {token.amount
                    ? toDisplayCoinDecimals({
                        num: token.amount,
                        decimals: token.coin_info?.decimals,
                        round: 2,
                      })
                    : 0}
                </Text>
              </td>
            </tr>
          ))}
        </tbody>
      </table> */}

      <div className="grid mobile-sm:grid-cols-2 sm:grid-cols-4">
        {ownedCoins.map((coin) => (
          <EmojiCard key={coin.coin_type} coinData={coin} />
        ))}
      </div>
    </div>
  );
};
