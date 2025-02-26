"use client";

import { parseJSONWithBigInts } from "@sdk/indexer-v2/json-bigint";
import { type fetchSenderSwapEvents } from "@sdk/indexer-v2/queries/misc/fetch-wallet-swaps";
import { useQuery } from "@tanstack/react-query";
import EmojiPickerWithInput from "components/emoji-picker/EmojiPickerWithInput";
import { FormattedNumber } from "components/FormattedNumber";
import SearchBar from "components/inputs/search-bar";
import { ColoredPriceDisplay } from "components/misc/ColoredPriceDisplay";
import { AptCell } from "components/ui/table-cells/apt-cell";
import { TimeCell } from "components/ui/table-cells/time-cell";
import { EcTable, type EcTableColumn } from "components/ui/table/ecTable";
import { useEmojiPicker } from "context/emoji-picker-context";
import { cn } from "lib/utils/class-name";
import { toNominal } from "lib/utils/decimals";
import { sortEvents } from "lib/utils/sort-events";
import _ from "lodash";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo } from "react";
import { parseJSON } from "utils";
import { Emoji } from "utils/emoji";

type SwapEvent = Awaited<ReturnType<typeof fetchSenderSwapEvents>>[number];

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
    renderCell: (item) => <TimeCell date={item.transaction.timestamp} />,
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
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const createQueryString = useCallback(
    (name: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set(name, value);

      return params.toString();
    },
    [searchParams]
  );

  const emojis = useEmojiPicker((s) => s.emojis);

  const { data } = useQuery<Awaited<ReturnType<typeof fetchSenderSwapEvents>>>({
    queryKey: ["fetchSwapEvents", address],
    queryFn: () =>
      fetch(`/wallet/${address}/swaps`)
        .then(async (res) => res.text())
        .then((res) => parseJSON(res)),
  });

  useEffect(() => {
    if (emojis) {
      router.push(pathname + "?" + createQueryString("emoji", emojis.join()));
    }
  }, [createQueryString, emojis]);

  return (
    <>
      <SearchBar />
      <EcTable
        className={cn(
          "flex mobile-sm:max-w-[calc(100vw-20px)] sm:max-w-[80vw] h-[60dvh] m-auto",
          "overflow-auto shadow-[0_0_0_1px_var(--dark-gray)]"
        )}
        getKey={(item) => item.guid}
        columns={COLUMNS}
        items={data}
      />
    </>
  );
};
