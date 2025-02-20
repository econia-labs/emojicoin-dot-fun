import { type Types } from "@sdk-types";
import { calculateCirculatingSupply } from "@sdk/markets";
import { toNominalPrice } from "@sdk/utils";
import { FormattedNumber } from "components/FormattedNumber";
import { AptCell } from "components/ui/table-cells/apt-cell";
import { WalletAddressCell } from "components/ui/table-cells/wallet-address-cell";
import { EcTable, type EcTableColumn } from "components/ui/table/ecTable";
import { useAptPrice } from "context/AptPrice";
import { type TokenBalance } from "lib/aptos-indexer/fungible-assets";
import { toNominal } from "lib/utils/decimals";
import { useRouter } from "next/navigation";
import { useMemo, type FC } from "react";
import { ROUTES } from "router/routes";

interface Props {
  holders: TokenBalance[];
  marketView: Types["MarketView"];
}

const COLUMNS: EcTableColumn<
  Omit<TokenBalance, "amount"> & {
    amount: number;
    rank: number;
    supplyPercentage: number;
    value: number;
    usdValue: number;
  }
>[] = [
  {
    id: "rank",
    text: "Rank",
    width: 40,
    cellClassName: "pl-10",
    sortCallback: (holder) => holder.amount,
    renderCell: (holder) => holder.rank,
  },
  {
    id: "address",
    text: "Owner",
    width: 50,
    renderCell: (holder) => <WalletAddressCell address={holder.owner_address} />,
  },
  {
    id: "balance",
    text: "Balance",
    width: 80,
    renderCell: (holder) => <FormattedNumber scramble value={holder.amount} style={"fixed"} />,
  },
  {
    id: "supply-percentage",
    text: "Supply %",
    width: 80,
    renderCell: (holder) => <FormattedNumber scramble value={holder.supplyPercentage} suffix="%" />,
  },
  {
    id: "value",
    text: "Value",
    width: 80,
    renderCell: (holder) => <AptCell value={holder.value} />,
  },
  {
    id: "usd-value",
    text: "USD",
    width: 80,
    renderCell: (holder) => (
      <FormattedNumber scramble value={holder.usdValue} style={"fixed"} prefix="$" />
    ),
  },
];

export const CoinHolders: FC<Props> = ({ holders, marketView }) => {
  const aptPrice = useAptPrice();
  const maxSupply = useMemo(() => toNominal(calculateCirculatingSupply(marketView)), [marketView]);
  const router = useRouter();

  const holdersWithRank = useMemo(
    () =>
      holders.map((holder, index) => {
        const amount = toNominal(BigInt(holder.amount));
        const supplyPercentage = amount / maxSupply;
        const price = toNominalPrice(marketView.lastSwap.avgExecutionPriceQ64);
        const value = amount * price;
        const usdValue = value * (aptPrice || 0);
        return { ...holder, amount, supplyPercentage, value, usdValue, rank: index + 1 };
      }),
    [aptPrice, holders, marketView.lastSwap.avgExecutionPriceQ64, maxSupply]
  );
  return (
    <EcTable
      className="m-auto overflow-auto h-[330px]"
      onClick={(item) => router.push(`${ROUTES.wallet}/${item.owner_address}`)}
      textFormat="body-sm"
      columns={COLUMNS}
      getKey={(item) => item.owner_address}
      items={holdersWithRank}
    />
  );
};
