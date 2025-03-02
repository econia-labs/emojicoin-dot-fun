import { EcTable, type EcTableColumn } from "components/ui/table/ecTable";
import { useRouter } from "next/navigation";
import { useMemo } from "react";
import { type TradeHistoryProps } from "../../types";
import { FormattedNumber } from "components/FormattedNumber";
import { toExplorerLink } from "lib/utils/explorer-link";
import { AptCell } from "components/ui/table-cells/apt-cell";
import { toNominal } from "lib/utils/decimals";
import { ColoredPriceDisplay } from "components/misc/ColoredPriceDisplay";
import { TimeCell } from "components/ui/table-cells/time-cell";
import { type SwapEvent, useSwapEventsQuery } from "components/pages/wallet/useSwapEventsQuery";
import { useWallet } from "@aptos-labs/wallet-adapter-react";

export const PersonalTradeHistory = (props: TradeHistoryProps) => {
  const router = useRouter();
  const { account } = useWallet();

  const query = useSwapEventsQuery({
    sender: account?.address,
    marketId: props.data.marketID.toString(),
  });

  const columns: EcTableColumn<SwapEvent>[] = useMemo(
    () => [
      {
        id: "change",
        text: props.data.symbol,
        width: 100,
        renderCell: (item) => (
          <FormattedNumber
            className={item.swap.isSell ? "text-pink" : "text-green"}
            value={item.swap.baseVolume}
            nominalize
          />
        ),
      },
      {
        text: "Time",
        id: "time",
        width: 120,
        renderCell: (item) => <TimeCell date={new Date(Number(item.transaction.time / 1000n))} />,
      },
      {
        text: "Price",
        id: "price",
        width: 100,
        renderCell: (item) => (
          <ColoredPriceDisplay
            q64
            price={item.swap.avgExecutionPriceQ64}
            className={item.swap.isSell ? "text-pink" : "text-green"}
            decimals={9}
            style="fixed"
          />
        ),
      },
      {
        text: "APT",
        id: "apt",
        width: 100,
        renderCell: (item) => <AptCell value={toNominal(item.swap.quoteVolume)} />,
      },
    ],
    [props.data.symbol]
  );

  return (
    <EcTable
      className="m-auto overflow-auto h-[330px]"
      onClick={(item) =>
        router.push(
          toExplorerLink({
            linkType: "txn",
            value: `${item.transaction.version}`,
          })
        )
      }
      textFormat="body-sm"
      columns={columns}
      getKey={(item) => item.guid}
      items={query.data?.pages.flatMap((page) => page) || []}
    />
  );
};
