"use client";

import type { PoolsData } from "app/pools/page";
import SearchBar from "components/inputs/search-bar";
import { Liquidity, PoolsTable, TableHeaderSwitcher } from "components/pages/pools/components";
import { useEmojiPicker } from "context/emoji-picker-context";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import { Separator } from "@/components/Separator";
import { useAccountAddress } from "@/hooks/use-account-address";
import { encodeEmojis, getEmojisInString, type SymbolEmoji } from "@/sdk/emoji_data";
import type { SortMarketsBy } from "@/sdk/index";
import { DEFAULT_POOLS_SORT_BY } from "@/sdk/indexer-v2/queries/query-params";

import { usePoolData } from "./usePoolData";

const ClientPoolsPage = ({ initialData }: { initialData: PoolsData[] }) => {
  const searchParams = useSearchParams();
  const poolParam = searchParams.get("pool");
  const [sortBy, setSortBy] = useState<SortMarketsBy>(DEFAULT_POOLS_SORT_BY);
  const [orderBy, setOrderBy] = useState<"desc" | "asc">("desc");
  const [selectedIndex, setSelectedIndex] = useState<number | undefined>(poolParam ? 0 : undefined);
  const [page, setPage] = useState<number>(1);
  const [allDataIsLoaded, setAllDataIsLoaded] = useState<boolean>(false);
  const [pools, setPools] = useState<"all" | "mypools">("all");
  const [realEmojis, setRealEmojis] = useState(getEmojisInString(poolParam ?? ""));
  const { emojis, setEmojis } = useEmojiPicker((state) => ({
    emojis: state.emojis,
    setEmojis: state.setEmojis,
  }));
  useEffect(() => {
    setEmojis(realEmojis);
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, []);

  const accountAddress = useAccountAddress();

  useEffect(() => {
    setRealEmojis(emojis as SymbolEmoji[]);
  }, [emojis]);

  const { data: markets } = usePoolData(
    {
      account: pools === "mypools" ? accountAddress : undefined,
      page,
      sortBy,
      orderBy,
      searchBytes: realEmojis?.length ? encodeEmojis(realEmojis) : undefined,
    },
    initialData
  );

  return (
    <div className="mt-[15px] flex flex-col items-center justify-center border-y border-solid border-dark-gray">
      <div className="mx-auto w-full max-w-max">
        <div className="w-full px-8">
          <div className="flex w-full flex-col-reverse justify-between border-x border-solid border-dark-gray px-3 *:grow *:basis-0 md:flex-row">
            <SearchBar />
            <div className="-ml-3 w-[calc(100%+24px)] border-t border-solid border-dark-gray md:hidden" />
            <TableHeaderSwitcher
              title1="Pools"
              title2="My pools"
              onSelect={(title) => {
                if (title === "Pools" && pools !== "all") {
                  setPools("all");
                } else if (title === "My pools" && pools !== "mypools") {
                  setPools("mypools");
                }
              }}
            />
          </div>
          <Separator />
        </div>

        <div className="flex flex-col px-8 xl:flex-row">
          <div className="relative flex w-full border-x border-solid border-dark-gray xl:w-[57%]">
            <PoolsTable
              index={selectedIndex}
              data={markets}
              sortBy={(s) => {
                setSortBy(s);
                setPage(1);
                setAllDataIsLoaded(false);
              }}
              orderBy={(s) => {
                setOrderBy(s);
                setPage(1);
                setAllDataIsLoaded(false);
              }}
              onSelect={(index) => {
                setSelectedIndex(index);
              }}
              onEnd={() => {
                if (!allDataIsLoaded) {
                  setPage(page + 1);
                }
              }}
            />
          </div>
          <div className="-ml-8 w-[calc(100%+64px)] border-t border-solid border-dark-gray xl:hidden" />
          <div className="relative flex w-full grow border-x border-solid border-dark-gray xl:w-[43%]">
            <Liquidity market={selectedIndex !== undefined ? markets[selectedIndex] : undefined} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientPoolsPage;
