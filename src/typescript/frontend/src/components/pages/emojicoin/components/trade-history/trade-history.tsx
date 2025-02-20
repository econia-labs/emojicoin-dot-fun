import { EcTable, type EcTableColumn } from "components/ui/table/ecTable";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef } from "react";
import { type TradeHistoryProps } from "../../types";
import { useEventStore } from "context/event-store-context";
import { memoizedSortedDedupedEvents } from "lib/utils/sort-events";
import { getRankFromEvent } from "lib/utils/get-user-rank";
import Popup from "components/popup";
import { emoji } from "utils";
import { Emoji } from "utils/emoji";
import { FormattedNumber } from "components/FormattedNumber";
import { WalletAddressCell } from "components/ui/table-cells/wallet-address-cell";
import { toExplorerLink } from "lib/utils/explorer-link";
import { AptCell } from "components/ui/table-cells/apt-cell";
import { toNominal } from "lib/utils/decimals";
import { ColoredPriceDisplay } from "components/misc/ColoredPriceDisplay";

const toTableItem = ({ swap, transaction }) => ({
  ...getRankFromEvent(swap),
  apt: swap.quoteVolume,
  emoji: swap.baseVolume,
  date: new Date(Number(transaction.time / 1000n)),
  type: swap.isSell ? "sell" : "buy",
  priceQ64: swap.avgExecutionPriceQ64,
  swapper: swap.swapper,
  version: transaction.version,
});

const COLUMNS: EcTableColumn<Omit<ReturnType<typeof toTableItem>, "amount">>[] = [
  {
    text: "Rank",
    id: "rank",
    cellClassName: "pl-10",
    width: 100,
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
    width: 80,
    renderCell: (item) => <AptCell value={toNominal(item.apt)} />,
  },
  {
    text: "Amount",
    id: "amount",
    width: 80,
    renderCell: (item) => (
      <FormattedNumber value={item.emoji} className="ellipses" decimals={3} nominalize />
    ),
  },
  {
    text: "Time",
    id: "time",
    renderCell: (item) =>
      item.date.toLocaleString(undefined, {
        month: "2-digit" as const,
        day: "2-digit" as const,
        hour: "2-digit" as const,
        minute: "2-digit" as const,
        second: "2-digit" as const,
      }),
  },
  {
    text: "Price",
    id: "price",
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
    renderCell: (item) => <WalletAddressCell address={item.swapper} />,
  },
];

const HARD_LIMIT = 500;

export const TradeHistory = (props: TradeHistoryProps) => {
  const swaps = useEventStore((s) => s.markets.get(props.data.symbol)?.swapEvents ?? []);
  const router = useRouter();

  const initialLoad = useRef(true);
  useEffect(() => {
    initialLoad.current = false;
    return () => {
      initialLoad.current = true;
    };
  }, []);

  const sortedSwaps = useMemo(
    () =>
      memoizedSortedDedupedEvents({
        a: props.data.swaps,
        b: swaps,
        order: "desc",
        limit: HARD_LIMIT,
        canAnimateAsInsertion: !initialLoad.current,
      }).map(toTableItem),
    /* eslint-disable react-hooks/exhaustive-deps */
    [props.data.swaps.length, swaps.length]
  );

  return (
    <EcTable
      className="m-auto overflow-auto h-[330px]"
      onClick={(item) =>
        router.push(
          toExplorerLink({
            linkType: "txn",
            value: `${item.version}`,
          })
        )
      }
      textFormat="body-sm"
      columns={COLUMNS}
      getKey={(item) => item.version.toString()}
      items={sortedSwaps}
    />
  );
};
