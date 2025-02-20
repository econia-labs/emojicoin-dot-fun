import { type FullCoinData } from "app/wallet/[address]/page";
import { FormattedNumber } from "components/FormattedNumber";
import { AptCell } from "components/ui/table-cells/apt-cell";
import { TableCell, TableRow } from "components/ui/table/table";
import { useAptPrice } from "context/AptPrice";
import { useRouter } from "next/navigation";
import { useMemo, type FC } from "react";
import { ROUTES } from "router/routes";
import { Emoji } from "utils/emoji";

interface Props {
  index: number;
  coinData: FullCoinData;
  walletStats: {
    totalValue: number;
  };
}

export const PortfolioRow: FC<Props> = ({ coinData, index, walletStats }) => {
  const router = useRouter();
  const aptPrice = useAptPrice();
  const usdOwnedValue = useMemo(
    () => (aptPrice || 0) * coinData.ownedValue,
    [aptPrice, coinData.ownedValue]
  );
  return (
    <TableRow
      index={index}
      onClick={() => router.push("/market/" + coinData.emojiPath)}
      className="cursor-pointer"
    >
      <TableCell className="text-center">
        {!coinData.inBondingCurve ? (
          <a
            className="hover:underline"
            href={`${ROUTES.pools}?pool=${coinData.symbol}`}
            onClick={(e) => e.stopPropagation()}
          >
            <Emoji
              className={`${coinData.symbol.length <= 2 ? "text-[24px]" : "text-[20px]"} text-nowrap`}
              emojis={coinData.symbol}
            />
          </a>
        ) : (
          <Emoji
            className={`${coinData.symbol.length <= 2 ? "text-[24px]" : "text-[20px]"} text-nowrap`}
            emojis={coinData.symbol}
          />
        )}
      </TableCell>
      <TableCell className="text-end">
        <FormattedNumber
          scramble
          value={(coinData.ownedValue / walletStats.totalValue) * 100}
          suffix="%"
          style={"fixed"}
        />
      </TableCell>
      <TableCell className="text-right">
        <FormattedNumber scramble value={coinData.amount} style={"fixed"} />
      </TableCell>
      <TableCell className="text-right">
        <span className="flex items-center justify-end gap-1">
          <AptCell value={coinData.marketCap} />
        </span>
      </TableCell>
      <TableCell className="text-right">
        <span className="flex items-center justify-end gap-1">
          <FormattedNumber scramble value={usdOwnedValue} style={"fixed"} prefix="$" />
        </span>
      </TableCell>
      <TableCell className="text-right px-6">
        <span className="flex items-center justify-end gap-1">
          <AptCell value={coinData.ownedValue} />
        </span>
      </TableCell>
    </TableRow>
  );
};
