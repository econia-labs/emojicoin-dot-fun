"use client";

import { FormattedNumber } from "components/FormattedNumber";
import { ColoredPriceDisplay } from "components/misc/ColoredPriceDisplay";
import { AptCell } from "components/ui/table-cells/apt-cell";
import { TimeCell } from "components/ui/table-cells/time-cell";
import { EcTable, type EcTableColumn } from "components/ui/table/ecTable";
import { toNominal } from "lib/utils/decimals";
import _ from "lodash";
import { Emoji } from "utils/emoji";
import { type SwapEvent, useSwapEventsQuery } from "./useSwapEventsQuery";
import { useRouter } from "next/navigation";
import { ROUTES } from "router/routes";
import { emojiNamesToPath } from "utils/pathname-helpers";
import { toMarketEmojiData } from "@sdk/emoji_data";

const COLUMNS: EcTableColumn<SwapEvent>[] = [
  {
    id: "emoji",
    text: "Emoji",
    width: 80,
    renderCell: (item) => (
      <Emoji className={`text-[1.2em] text-nowrap`} emojis={item.market.emojis} />
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
    width: 80,
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
    renderCell: (item) => <AptCell value={toNominal(item.swap.quoteVolume)} />,
  },
  {
    id: "change",
    text: "Change",
    width: 80,
    renderCell: (item) => (
      <FormattedNumber
        className={item.swap.isSell ? "text-pink" : "text-green"}
        value={item.swap.baseVolume}
        nominalize
      />
    ),
  },
];

export const WalletTransactionTable = ({ address }: { address: string }) => {
  const query = useSwapEventsQuery(address);
  const router = useRouter();

  return (
    <>
      <EcTable
        className={"flex w-full overflow-auto h-[60dvh] shadow-[0_0_0_1px_var(--dark-gray)]"}
        getKey={(item) => item.guid}
        columns={COLUMNS}
        onClick={(item) => {
          router.push(
            `${ROUTES.market}/${emojiNamesToPath(item.market.symbolData.name.split(","))}`
          );
        }}
        items={query.data?.pages.flatMap((page) => page) ?? []}
        pagination={query}
      />
    </>
  );
};
