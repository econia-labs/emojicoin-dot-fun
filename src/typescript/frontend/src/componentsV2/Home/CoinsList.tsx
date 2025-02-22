"use client";
import React, { useEffect, useMemo } from "react";
import { symbolBytesToEmojis } from "@sdk/emoji_data";
import { useRouter } from "next/navigation";
import { MARKETS_PER_PAGE } from "lib/queries/sorting/const";
import { useEmojiPicker } from "context/emoji-picker-context";
import { encodeEmojis } from "@sdk/emoji_data";
import { useEventStore } from "context/event-store-context";
import useEvent from "@hooks/use-event";
import { constructURLForHomePage } from "lib/queries/sorting/query-params";
import { type HomePageProps } from "app/home/HomePage";
import { useReliableSubscribe } from "@hooks/use-reliable-subscribe";
import { type SortMarketsBy } from "@sdk/indexer-v2/types/common";
// import { useGridRowLength } from "components/pages/home/components/emoji-table/hooks/use-grid-items-per-line";
import { LiveClientGridV2 } from "./LiveClientGridV2";

export interface CoinsListProps
  extends Omit<HomePageProps, "featured" | "children" | "priceFeed"> {}

const CoinsList = (props: CoinsListProps): JSX.Element => {
  const router = useRouter();

  const { markets, page, sort, searchBytes } = useMemo(() => {
    const { markets, page, sortBy: sort } = props;
    const numMarkets = Math.max(props.numMarkets, 1);
    const pages = Math.ceil(numMarkets / MARKETS_PER_PAGE);
    const searchBytes = props.searchBytes ?? "";
    return { markets, page, sort, pages, searchBytes };
  }, [props]);

  const loadMarketStateFromServer = useEventStore((s) => s.loadMarketStateFromServer);
  const setEmojis = useEmojiPicker((s) => s.setEmojis);
  const emojis = useEmojiPicker((s) => s.emojis);

  useEffect(() => {
    loadMarketStateFromServer(markets);
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [markets]);

  useEffect(() => {
    const decoded = symbolBytesToEmojis(searchBytes ?? "");
    if (decoded.emojis.length > 0) {
      setEmojis(decoded.emojis.map((e) => e.emoji));
    }
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [searchBytes]);

  const pushURL = useEvent((args?: { page?: number; sort?: SortMarketsBy; emojis?: string[] }) => {
    const newURL = constructURLForHomePage({
      page: args?.page ?? page,
      sort: args?.sort ?? sort,
      searchBytes: encodeEmojis(args?.emojis ?? emojis),
    });

    router.push(newURL.toString(), { scroll: false });
  });

  // const handlePageChange = (page: number) => {
  //   const newPage = Math.min(Math.max(1, page), pages);
  //   pushURL({ page: newPage });
  // };

  // const handleSortChange = (newPage: SortMarketsBy) => {
  //   pushURL({ sort: newPage });
  // };

  useEffect(() => {
    pushURL({ page: 0 });
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [emojis]);

  // const animationsOn = useUserSettings((s) => s.animate);

  // const shouldAnimateGrid = useMemo(
  //   () => animationsOn && sort === SortMarketsBy.BumpOrder && page === 1 && !searchBytes,
  //   [sort, page, searchBytes, animationsOn]
  // );

  // const rowLength = useGridRowLength();

  useReliableSubscribe({
    eventTypes: ["MarketLatestState"],
  });

  return <LiveClientGridV2 markets={markets} sortBy={sort} />;
};

export default CoinsList;
