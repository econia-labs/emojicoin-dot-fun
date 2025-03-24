import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { toNominal } from "@sdk/utils";
import { FormattedNumber } from "components/FormattedNumber";
import { ColoredPriceDisplay } from "components/misc/ColoredPriceDisplay";
import { type SwapEvent, useSwapEventsQuery } from "components/pages/wallet/useSwapEventsQuery";
import { EcTable, type EcTableColumn } from "components/ui/table/ecTable";
import { AptCell } from "components/ui/table-cells/apt-cell";
import { TimeCell } from "components/ui/table-cells/time-cell";
import { toExplorerLink } from "lib/utils/explorer-link";
import { useMemo } from "react";
import { Emoji } from "utils/emoji";

import type { TradeHistoryProps } from "../../types";

export const PersonalTradeHistory = (props: TradeHistoryProps) => {
  const { account, connected } = useWallet();

  const query = useSwapEventsQuery(
    {
      sender: account?.address,
      marketID: props.data.marketID.toString(),
    },
    !connected
  );

  const columns: EcTableColumn<SwapEvent>[] = useMemo(
    () => [
      {
        id: "change",
        text: <Emoji emojis={props.data.symbol} />,
        width: 100,
        renderCell: (item) => (
          <FormattedNumber
            className={item.swap.isSell ? "text-pink" : "text-green"}
            prefix={item.swap.isSell ? "- " : "+ "}
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
        window.open(
          toExplorerLink({
            linkType: "txn",
            value: `${item.transaction.version}`,
          }),
          "_blank"
        )
      }
      textFormat="body-sm"
      emptyText="No trade history"
      columns={columns}
      getKey={(item) => item.guid}
      isLoading={query.isLoading}
      items={query.data?.pages.flatMap((page) => page) || []}
    />
  );
};
