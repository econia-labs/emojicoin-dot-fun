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
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { OrderByStrings } from "@sdk/indexer-v2/const";
import { encodeEmojis, type AnyEmoji, type SymbolEmoji } from "@sdk/emoji_data";
import { fetchSpecificMarketsAction } from "./fetch-specific-markets-action";
import { ROUTES } from "router/routes";
import { emojiNamesToPath } from "utils/pathname-helpers";
import { toExplorerLink } from "lib/utils/explorer-link";

const COLUMNS: EcTableColumn<SwapEvent>[] = [
  {
    id: "emoji",
    text: "Emoji",
    cellClassName: "pl-6",
    renderCell: (item) => (
      <a
        onClick={(e) => e.stopPropagation()}
        className="w-full"
        href={`${ROUTES.market}/${emojiNamesToPath(item.market.emojis.map((em) => em.name))}`}
      >
        <Emoji className={`text-[1.2em] text-nowrap`} emojis={item.market.emojis} />
      </a>
    ),
  },
  {
    text: "Time",
    id: "time",
    width: 120,
    isServerSideSortable: true,
    renderCell: (item) => (
      <a
        href={toExplorerLink({
          linkType: "txn",
          value: `${item.transaction.version}`,
        })}
        onClick={(e) => e.stopPropagation()}
        className="hover:underline"
      >
        <TimeCell date={new Date(Number(item.transaction.time / 1000n))} />
      </a>
    ),
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

export const WalletTransactionTable = ({
  address,
  emojis,
  setEmojis,
}: {
  address: string;
  emojis: SymbolEmoji[];
  setEmojis: (emojis: AnyEmoji[]) => void;
}) => {
  const [orderBy, setOrderBy] = useState<OrderByStrings>("desc");

  const marketQuery = useQuery({
    queryKey: ["fetchMarket", emojis],
    queryFn: async () => {
      const markets = await fetchSpecificMarketsAction([emojis]);
      if (markets.length === 0) return null;
      return markets[0];
    },
    enabled: emojis.length > 0,
  });

  const query = useSwapEventsQuery({
    sender: address,
    orderBy,
    symbolEmojis: emojis?.length > 0 ? encodeEmojis(emojis) : undefined,
  });

  return (
    <>
      <EcTable
        className={"flex w-full overflow-auto h-[60dvh]"}
        getKey={(item) => item.guid}
        columns={COLUMNS}
        onClick={(item) => {
          setEmojis(item.market.symbolEmojis);
        }}
        defaultSortColumn="time"
        items={query.data?.pages.flatMap((page) => page) ?? []}
        isLoading={query.isLoading || marketQuery.isFetching}
        // In this case we can only sort by a single column, so no need to check for column.
        serverSideOrderHandler={(_, dir) => setOrderBy(dir)}
        pagination={query}
      />
    </>
  );
};
