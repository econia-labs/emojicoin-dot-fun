import { EcTable, type EcTableColumn } from "components/ui/table/ecTable";
import { useMemo } from "react";
import { type TradeHistoryProps } from "../../types";
import { useEventStore } from "context/event-store-context";
import Popup from "components/popup";
import { emoji } from "utils";
import { Emoji } from "utils/emoji";
import { FormattedNumber } from "components/FormattedNumber";
import { WalletAddressCell } from "components/ui/table-cells/wallet-address-cell";
import { toExplorerLink } from "lib/utils/explorer-link";
import { AptCell } from "components/ui/table-cells/apt-cell";
import { toNominal } from "@sdk/utils";
import { ColoredPriceDisplay } from "components/misc/ColoredPriceDisplay";
import { TimeCell } from "components/ui/table-cells/time-cell";
import { useSwapEventsQuery } from "@/components/pages/wallet/useSwapEventsQuery";
import _ from "lodash";
import { getRankFromEvent } from "lib/utils/get-user-rank";
import { type SwapEventModel } from "@sdk/indexer-v2";

const toTableItem = ({ swap, transaction, guid }: SwapEventModel) => ({
  ...getRankFromEvent(swap),
  apt: swap.quoteVolume,
  emoji: swap.baseVolume,
  date: new Date(Number(transaction.time / 1000n)),
  type: swap.isSell ? "sell" : "buy",
  priceQ64: swap.avgExecutionPriceQ64,
  sender: swap.sender,
  version: transaction.version,
  guid,
});

export const TradeHistory = (props: TradeHistoryProps) => {
  const swapsFromStore = useEventStore((s) => s.markets.get(props.data.symbol)?.swapEvents ?? []);

  const swapsQuery = useSwapEventsQuery({ marketID: props.data.marketID.toString() });

  const sortedSwaps = useMemo(() => {
    return _.orderBy(
      _.uniqBy([...swapsFromStore, ...(swapsQuery.data?.pages.flat() || [])], (i) => i.guid),
      (i) => i.transaction.version,
      "desc"
    ).map((s, i) => (i === 0 ? { ...toTableItem(s), animateInsertion: true } : toTableItem(s)));
  }, [swapsQuery.data?.pages, swapsFromStore]);

  const columns: EcTableColumn<(typeof sortedSwaps)[number]>[] = useMemo(
    () => [
      {
        text: "Rank",
        id: "rank",
        width: 50,
        renderCell: (item) => (
          <Popup
            content={
              item.rankIcon === emoji("blowfish")
                ? "n00b"
                : item.rankIcon === emoji("spouting whale")
                  ? "365 UR SO JULIA"
                  : "SKILL ISSUE"
            }
            uppercase={false}
          >
            <div className="flex h-full relative">
              <Emoji className="text-light-gray m-auto" emojis={item.rankIcon} />
            </div>
          </Popup>
        ),
      },
      {
        text: "APT",
        id: "apt",
        width: 70,
        renderCell: (item) => <AptCell value={toNominal(item.apt)} />,
      },
      {
        text: props.data.symbol,
        id: "amount",
        width: 100,
        renderCell: (item) => (
          <FormattedNumber value={item.emoji} className="ellipses" decimals={3} nominalize />
        ),
      },
      {
        text: "Time",
        id: "time",
        width: 120,
        renderCell: (item) => <TimeCell date={item.date} />,
      },
      {
        text: "Price",
        id: "price",
        width: 80,
        renderCell: (item) => (
          <ColoredPriceDisplay
            q64
            price={item.priceQ64}
            className={item.type === "sell" ? "text-pink" : "text-green"}
            decimals={9}
            style="fixed"
          />
        ),
      },
      {
        text: "Sender",
        id: "sender",
        width: 120,
        renderCell: (item) => <WalletAddressCell address={item.sender} />,
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
            value: `${item.version}`,
          }),
          "_blank"
        )
      }
      textFormat="body-sm"
      columns={columns}
      getKey={(item) => item.guid}
      items={sortedSwaps}
      pagination={swapsQuery}
    />
  );
};
