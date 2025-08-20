import { FormattedNumber } from "components/FormattedNumber";
import { EcTable, type EcTableColumn } from "components/ui/table/ecTable";
import { AptCell } from "components/ui/table-cells/apt-cell";
import { WalletAddressCell } from "components/ui/table-cells/wallet-address-cell";
import { useAptPrice } from "context/AptPrice";
import { useTopHolders } from "lib/hooks/queries/use-top-holders";
import { useRouter } from "next/navigation";
import { type FC, useMemo } from "react";
import { ROUTES } from "router/routes";

import type { MarketStateModel } from "@/sdk/index";
import { calculateCirculatingSupply } from "@/sdk/markets";
import { toNominal, toNominalPrice } from "@/sdk/utils";

interface Props {
  emojicoin: string;
  state: MarketStateModel["state"];
  lastSwap: MarketStateModel["lastSwap"];
  marketAddress: `0x${string}`;
}

export const CoinHolders: FC<Props> = ({ emojicoin, state, lastSwap, marketAddress }) => {
  const aptPrice = useAptPrice();
  const maxSupply = useMemo(() => toNominal(calculateCirculatingSupply(state)), [state]);
  const router = useRouter();

  const { isLoading, data: holders } = useTopHolders(marketAddress);

  const holdersWithRank = useMemo(
    () =>
      holders.map((holder, index) => {
        const amount = toNominal(BigInt(holder.amount));
        const supplyPercentage = (amount / maxSupply) * 100;
        const price = toNominalPrice(lastSwap.avgExecutionPriceQ64);
        const value = amount * price;
        const usdValue = value * (aptPrice || 0);
        return { ...holder, amount, supplyPercentage, value, usdValue, rank: index + 1 };
      }),
    [aptPrice, holders, lastSwap.avgExecutionPriceQ64, maxSupply]
  );

  const columns: EcTableColumn<(typeof holdersWithRank)[number]>[] = useMemo(
    () => [
      {
        id: "rank",
        headerContent: "Rank",
        width: 100,
        cellClassName: "pl-10",
        sortFn: (holder) => holder.amount,
        renderCell: (holder) => holder.rank,
      },
      {
        id: "value",
        headerContent: "APT",
        width: 80,
        renderCell: (holder) => <AptCell value={holder.value} decimals={2} style="fixed" />,
      },
      {
        id: "balance",
        headerContent: emojicoin,
        width: 120,
        renderCell: (holder) => <FormattedNumber value={holder.amount} style={"fixed"} />,
      },
      {
        id: "supply-percentage",
        headerContent: "Supply %",
        width: 120,
        renderCell: (holder) => (
          <FormattedNumber value={holder.supplyPercentage} style={"fixed"} suffix="%" />
        ),
      },
      {
        id: "usd-value",
        headerContent: "USD",
        width: 100,
        renderCell: (holder) => (
          <FormattedNumber value={holder.usdValue} style={"fixed"} prefix="$" />
        ),
      },
      {
        id: "address",
        headerContent: "Holder",
        width: 160,
        renderCell: (holder) => <WalletAddressCell address={holder.owner_address} />,
      },
    ],
    [emojicoin]
  );
  return (
    <EcTable
      className="m-auto overflow-auto h-[330px]"
      onClick={(item) => router.push(`${ROUTES.wallet}/${item.owner_address}`)}
      textFormat="body-sm"
      columns={columns}
      getKey={(item) => item.owner_address}
      items={holdersWithRank}
      isLoading={isLoading}
    />
  );
};
