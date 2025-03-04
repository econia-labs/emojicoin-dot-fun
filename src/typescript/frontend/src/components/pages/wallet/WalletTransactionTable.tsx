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
import { useState } from "react";
import { type OrderByStrings } from "@sdk/indexer-v2/const";

const COLUMNS: EcTableColumn<SwapEvent>[] = [
  {
    id: "emoji",
    text: "Emoji",
    renderCell: (item) => (
      <span className="w-full">
        <Emoji className={`text-[1.2em] text-nowrap`} emojis={item.market.emojis} />
      </span>
    ),
  },
  {
    text: "Time",
    id: "time",
    width: 120,
    isServerSideSortable: true,
    renderCell: (item) => <TimeCell date={new Date(Number(item.transaction.time / 1000n))} />,
  },
  {
    text: "Price",
    id: "price",
    width: 120,
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
  {
    id: "change",
    text: "Change",
    width: 120,
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
  const [orderBy, setOrderBy] = useState<OrderByStrings>("desc");
  const query = useSwapEventsQuery({ sender: address, orderBy });
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
        defaultSortColumn="time"
        items={query.data?.pages.flatMap((page) => page) ?? []}
        isLoading={query.isLoading}
        // In this case we can only sort by a single column, so no need to check for column.
        serverSideOrderHandler={(_, dir) => setOrderBy(dir)}
        pagination={query}
      />
    </>
  );
};
