import { FormattedNumber } from "components/FormattedNumber";
import { TableCell, TableRow } from "components/ui/table/table";
import { AptCell } from "components/ui/table-cells/apt-cell";
import { useAptPrice } from "context/AptPrice";
import { type FullCoinData } from "lib/hooks/queries/use-fetch-owner-emojicoin-balances";
import { useRouter } from "next/navigation";
import { useMemo } from "react";
import { ROUTES } from "router/routes";
import { Emoji } from "utils/emoji";

interface Props {
  index: number;
  coinData: FullCoinData;
  totalValue: number;
}

export const PortfolioRow = ({ coinData, index, totalValue }: Props) => {
  const router = useRouter();
  const aptPrice = useAptPrice();
  const usdOwnedValue = useMemo(
    () => (aptPrice || 0) * coinData.ownedValue,
    [aptPrice, coinData.ownedValue]
  );
  return (
    <TableRow
      index={index}
      onClick={() => router.push(`${ROUTES.market}/${coinData.emojiPath}`)}
      className="cursor-pointer"
    >
      <TableCell className="text-center">
        {!coinData.inBondingCurve ? (
          <a
            className="hover:underline"
            href={`${ROUTES.pools}?pool=${coinData.symbol}`}
            onClick={(e) => e.stopPropagation()}
          >
            <Emoji className={`text-[1.2em] text-nowrap`} emojis={coinData.symbol} />
          </a>
        ) : (
          <Emoji className={`text-[1.2em] text-nowrap`} emojis={coinData.symbol} />
        )}
      </TableCell>
      <TableCell className="text-end">
        <FormattedNumber
          value={(coinData.ownedValue / totalValue) * 100}
          suffix="%"
          style={"fixed"}
          className="mr-[2em]"
        />
      </TableCell>
      <TableCell className="text-right">
        <FormattedNumber value={coinData.amount} style={"fixed"} className="mr-[1.25em]" />
      </TableCell>
      <TableCell className="text-right">
        <span className="flex items-center justify-end gap-1">
          {aptPrice ? (
            <FormattedNumber
              value={coinData.marketCap * aptPrice}
              prefix={"$"}
              style={"fixed"}
              decimals={2}
            />
          ) : (
            <AptCell value={coinData.marketCap} />
          )}
        </span>
      </TableCell>
      <TableCell className="text-right">
        <span className="flex items-center justify-end gap-1 mr-[1.75em]">
          <FormattedNumber value={usdOwnedValue} style={"fixed"} prefix="$" />
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
