"use client";

import type { PoolsData } from "app/pools/page";
import { Liquidity } from "components/pages/pools/components";
import { useEmojiPicker } from "context/emoji-picker-context";
import { toCoinDecimalString } from "lib/utils/decimals";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { emoji } from "utils";
import { Emoji } from "utils/emoji";

import { FormattedNumber } from "@/components/FormattedNumber";
import SearchBar from "@/components/inputs/search-bar";
import { Separator } from "@/components/Separator";
import { EcTable, type EcTableColumn } from "@/components/ui/table/ecTable";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs/tabs";
import { useAccountAddress } from "@/hooks/use-account-address";
import { encodeEmojis, getEmojisInString, type SymbolEmoji } from "@/sdk/emoji_data";
import { SortMarketsBy } from "@/sdk/index";

import { DprCell } from "./components/DprCell";
import { DprTooltip } from "./components/DprTooltip";
import { EmojiWithMarketLink } from "./components/EmojiWithMarketLink";
import { usePoolData } from "./usePoolData";

const COLUMNS: EcTableColumn<PoolsData>[] = [
  {
    id: "pool",
    headerContent: "Pool",
    width: 50,
    className: "text-center",
    headClassName: "text-center",
    cellClassName: "text-center",
    renderCell: (item) => <EmojiWithMarketLink emojis={item.market.emojis} />,
  },
  {
    id: SortMarketsBy.AllTimeVolume,
    headerContent: "All-time Volume",
    width: 170,
    className: "text-left",
    headClassName: "text-left",
    cellClassName: "text-left",
    isServerSideSortable: true,
    renderCell: (item) => (
      <FormattedNumber
        title={`${toCoinDecimalString(item.state.cumulativeStats.quoteVolume, 2)} APT`}
        value={item.state.cumulativeStats.quoteVolume}
        suffix=" APT"
        nominalize
      />
    ),
  },
  {
    id: SortMarketsBy.DailyVolume,
    headerContent: "24h Vol",
    width: 100,
    className: "text-right",
    headClassName: "text-right",
    cellClassName: "text-right",
    isServerSideSortable: true,
    renderCell: (item) => (
      <FormattedNumber
        title={`${toCoinDecimalString(item.dailyVolume, 2)} APT`}
        value={item.dailyVolume}
        suffix=" APT"
        nominalize
      />
    ),
  },
  {
    id: SortMarketsBy.Tvl,
    headerContent: "Tvl",
    width: 100,
    className: "text-right",
    headClassName: "text-right",
    cellClassName: "text-right",
    isServerSideSortable: true,
    renderCell: (item) => (
      <FormattedNumber
        title={`${toCoinDecimalString(item.state.cpammRealReserves.quote * 2n, 2)} APT`}
        value={item.state.cpammRealReserves.quote * 2n}
        suffix=" APT"
        nominalize
      />
    ),
  },
  {
    id: SortMarketsBy.Apr,
    headerContent: (
      <div className="flex items-center gap-2">
        <DprTooltip />
        DPR
      </div>
    ),
    width: 150,
    className: "text-right",
    headClassName: "text-right",
    cellClassName: "text-right",
    isServerSideSortable: true,
    renderCell: (item) => <DprCell dailyTvlPerLPCoinGrowth={item.dailyTvlPerLPCoinGrowth} />,
  },
] as const;

const ClientPoolsPage = () => {
  const searchParams = useSearchParams();
  const poolParam = searchParams.get("pool");
  const [sortBy, setSortBy] = useState<SortMarketsBy>(SortMarketsBy.Apr);
  const [orderBy, setOrderBy] = useState<"desc" | "asc">("desc");
  const [selectedIndex, setSelectedIndex] = useState<number | undefined>(poolParam ? 0 : undefined);
  const [realEmojis, setRealEmojis] = useState(getEmojisInString(poolParam ?? ""));
  const { emojis, setEmojis } = useEmojiPicker((state) => ({
    emojis: state.emojis,
    setEmojis: state.setEmojis,
  }));

  const [tab, setTab] = useState<"pools" | "myPools">("pools");

  useEffect(() => {
    setEmojis(realEmojis);
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, []);

  const accountAddress = useAccountAddress();

  useEffect(() => {
    setRealEmojis(emojis as SymbolEmoji[]);
  }, [emojis]);

  const query = usePoolData({
    account: tab === "myPools" ? accountAddress : undefined,
    sortBy,
    orderBy,
    searchBytes: realEmojis?.length ? encodeEmojis(realEmojis) : undefined,
  });

  const allMarkets = useMemo(
    () => query.data?.pages.flatMap((page) => page) ?? [],
    [query.data?.pages]
  );

  return (
    <>
      <div className="flex flex-col items-center relative">
        <Separator className="absolute" />
        <div className="flex w-full px-8 flex-col xl:flex-row max-w-[1392px] border-r border-solid border-dark-gray">
          <Tabs
            className="w-full xl:flex-[0_0_58%] border-l border-solid border-dark-gray"
            value={tab}
            onValueChange={(v) => setTab(v as "pools" | "myPools")}
          >
            <TabsList className="justify-between pt-0">
              <div className="flex items-center gap-2">
                <TabsTrigger value="pools" endSlot={<Emoji emojis={emoji("man swimming")} />}>
                  Pools
                </TabsTrigger>
                <TabsTrigger
                  value="myPools"
                  endSlot={<Emoji emojis={emoji("person raising hand")} />}
                >
                  My Pools
                </TabsTrigger>
              </div>
              <SearchBar className="max-w-[300px]" />
            </TabsList>
            <Separator className="absolute" />
            <div className={"flex w-full overflow-auto h-[40dvh] xl:h-[70dvh]"}>
              <EcTable
                isLoading={query.isLoading}
                variant="select"
                columns={COLUMNS}
                items={allMarkets}
                className="[&_td]:text-xs"
                getKey={(i) => i.market.marketID.toString()}
                onClick={(_, i) => setSelectedIndex(i)}
                pagination={query}
                onSortChange={(col, dir) => {
                  setSortBy(col as SortMarketsBy);
                  setOrderBy(dir);
                }}
              />
            </div>
            <Separator className="xl:hidden" />
          </Tabs>
          <div className="relative xl:flex-1 flex min-h-[600px] justify-center items-center border-l border-solid border-dark-gray">
            <Liquidity
              market={selectedIndex !== undefined ? allMarkets[selectedIndex] : undefined}
            />
          </div>
        </div>
      </div>
      <Separator />
    </>
  );
};

export default ClientPoolsPage;
