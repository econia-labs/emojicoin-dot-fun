import AptosIconBlack from "@icons/AptosBlack";
import { type FullCoinData } from "app/wallet/[address]/page";
import { FormattedNumber } from "components/FormattedNumber";
import { TableCell, TableRow } from "components/ui/table";
import { useRouter } from "next/navigation";
import { type FC } from "react";
import { Emoji } from "utils/emoji";

interface Props {
  coinData: FullCoinData;
}

export const EmojiCard: FC<Props> = ({ coinData }) => {
  const router = useRouter();
  return (
    <TableRow
      onClick={() => router.push("/market/" + coinData.emojiPath)}
      className="cursor-pointer"
    >
      <TableCell>
        <Emoji
          className={`${coinData.symbol.length <= 2 ? "text-[24px]" : "text-[20px]"} text-nowrap`}
          emojis={coinData.symbol}
        />
      </TableCell>
      <TableCell>{coinData.emojiName}</TableCell>
      <TableCell className="text-right">
        <FormattedNumber value={coinData.amount} style={"fixed"} />
      </TableCell>
      <TableCell className="text-right">
        <FormattedNumber value={coinData.ownedValue} style={"fixed"} />{" "}
        <AptosIconBlack className="icon-inline text-xl" />
      </TableCell>
      <TableCell></TableCell>
    </TableRow>
  );
};
