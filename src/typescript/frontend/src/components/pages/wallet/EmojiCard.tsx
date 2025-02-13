import { symbolBytesToEmojis } from "@sdk/emoji_data";
import { type CoinData } from "app/wallet/[address]/page";
import { FormattedNumber } from "components/FormattedNumber";
import { TableCell, TableRow } from "components/ui/table";
import { toDisplayCoinDecimals } from "lib/utils/decimals";
import { emojisToName } from "lib/utils/emojis-to-name-or-symbol";
import { useRouter } from "next/navigation";
import { useMemo, type FC } from "react";
import { Emoji } from "utils/emoji";
import { emojiNamesToPath } from "utils/pathname-helpers";

interface Props {
  coinData: CoinData;
}

export const EmojiCard: FC<Props> = ({ coinData }) => {
  const router = useRouter();
  const price = 0;
  const { emojiData, emojiName, amountDisplayString, emojiPath } = useMemo(() => {
    const emojiData = symbolBytesToEmojis(coinData.coin_info.symbol);
    const emojiName = emojisToName(emojiData.emojis);
    const amountDisplayString = toDisplayCoinDecimals({
      num: coinData.amount,
      decimals: coinData.coin_info?.decimals,
      round: 2,
    });
    const emojiPath = emojiNamesToPath(emojiData.emojis.map((x) => x.name));
    return { emojiData, emojiName, amountDisplayString, emojiPath };
  }, [coinData]);

  return (
    <TableRow onClick={() => router.push("/market/" + emojiPath)} className="cursor-pointer">
      <TableCell>
        <Emoji
          className={`${coinData.coin_info.symbol.length <= 2 ? "text-[24px]" : "text-[20px]"} text-nowrap`}
          emojis={coinData.coin_info.symbol}
        />
      </TableCell>
      <TableCell>{emojiName}</TableCell>
      <TableCell>
        <FormattedNumber suffix={` ${coinData.coin_info.symbol}`} value={amountDisplayString} />
      </TableCell>
      <TableCell>
        <FormattedNumber value={price} suffix=" APT" />
      </TableCell>
    </TableRow>
  );
};
