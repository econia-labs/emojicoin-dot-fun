import AptosIconBlack from "@icons/AptosBlack";
import { type Types } from "@sdk-types";
import { calculateCirculatingSupply } from "@sdk/markets";
import { toNominalPrice } from "@sdk/utils";
import { FormattedNumber } from "components/FormattedNumber";
import { WalletAddressCell } from "components/ui/table-cells/wallet-address-cell";
import { EcTable, type EcTableColumn } from "components/ui/table/ecTable";
import { useAptPrice } from "context/AptPrice";
import { type TokenBalance } from "lib/aptos-indexer/fungible-assets";
import { toNominal } from "lib/utils/decimals";
import { useMemo, type FC } from "react";

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
    className: "w-[80px] justify-start",
    sortCallback: (holder) => holder.amount,
    renderCell: (holder) => <span className="flex pl-5 justify-start">{holder.rank}</span>,
  },
  {
    id: "address",
    text: "Owner",
    className: "w-[150px] justify-end",
    renderCell: (holder) => <WalletAddressCell address={holder.owner_address} />,
  },
  {
    id: "balance",
    text: "Balance",
    className: "w-[150px] justify-end",
    renderCell: (holder) => <FormattedNumber scramble value={holder.amount} style={"fixed"} />,
  },
  {
    id: "supply-percentage",
    text: "Supply %",
    className: "w-[150px] justify-end",
    renderCell: (holder) => <FormattedNumber scramble value={holder.supplyPercentage} suffix="%" />,
  },
  {
    id: "value",
    text: "Value",
    className: "justify-end",
    renderCell: (holder) => (
      <span className="flex gap-1 items-center justify-end">
        <FormattedNumber scramble value={holder.value} style={"fixed"} />
        <AptosIconBlack className="ml-1 icon-inline text-xl" />
      </span>
    ),
  },
  {
    id: "usd-value",
    text: "USD Value",
    className: "justify-end",
    renderCell: (holder) => (
      <FormattedNumber scramble value={holder.usdValue} style={"fixed"} prefix="$" />
    ),
  },
];

export const CoinHolders: FC<Props> = ({ holders, marketView }) => {
  const aptPrice = useAptPrice();
  const maxSupply = useMemo(() => toNominal(calculateCirculatingSupply(marketView)), [marketView]);

  const holdersWithRank = useMemo(
    () =>
      holders.map((holder, index) => {
        const amount = toNominal(BigInt(holder.amount));
        const supplyPercentage = amount / maxSupply;
        const price = toNominalPrice(marketView.lastSwap.avgExecutionPriceQ64);
        const value = amount * price;
        const usdValue = price * amount;
        return { ...holder, amount, supplyPercentage, value, usdValue, rank: index + 1 };
      }),
    [holders, maxSupply]
  );
  return (
    <div className="m-auto overflow-auto w-[90vw] h-[400px]">
      <EcTable
        textFormat="body-sm"
        columns={COLUMNS}
        getId={(item) => item.owner_address}
        items={holdersWithRank}
      />
    </div>
  );
};
