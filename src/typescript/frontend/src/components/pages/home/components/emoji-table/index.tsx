"use client";

import type { HomePageProps } from "app/home/HomePage";
import SearchBar from "components/inputs/search-bar";
import Text from "components/text";
import { useEmojiPicker } from "context/emoji-picker-context";
import { useEventStore, useUserSettings } from "context/event-store-context";
import { AnimatePresence, motion } from "framer-motion";
import { MARKETS_PER_PAGE } from "lib/queries/sorting/const";
import { constructURLForHomePage } from "lib/queries/sorting/query-params";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo } from "react";
import { ROUTES } from "router/routes";
import { Emoji } from "utils/emoji";

import useEvent from "@/hooks/use-event";
import { encodeEmojis, symbolBytesToEmojis } from "@/sdk/emoji_data";
import { SortMarketsBy } from "@/sdk/indexer-v2/types/common";

import { EMOJI_GRID_ITEM_WIDTH } from "../const";
import { LiveClientGrid } from "./AnimatedClientGrid";
import { ClientGrid } from "./ClientGrid";
import { ButtonsBlock } from "./components/buttons-block";
import FilterOptions from "./components/FilterOptions";
import { useGridRowLength } from "./hooks/use-grid-items-per-line";
import {
  FilterOptionsWrapper,
  GRID_PADDING,
  InnerGridContainer,
  OuterContainer,
  OutermostContainer,
  SearchWrapper,
  StyledGrid,
} from "./styled";

interface EmojiTableProps
  extends Omit<HomePageProps, "featured" | "children" | "priceFeed" | "meleeData"> {}

const EmojiTable = (props: EmojiTableProps) => {
  const router = useRouter();

  const { markets, page, sort, pages, searchBytes } = useMemo(() => {
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

  const handlePageChange = (page: number) => {
    const newPage = Math.min(Math.max(1, page), pages);
    pushURL({ page: newPage });
  };

  const handleSortChange = (newPage: SortMarketsBy) => {
    pushURL({ sort: newPage });
  };

  useEffect(() => {
    pushURL({ page: 0 });
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [emojis]);

  const animationsOn = useUserSettings((s) => s.animate);

  const shouldAnimateGrid = useMemo(
    () => animationsOn && sort === SortMarketsBy.BumpOrder && page === 1 && !searchBytes,
    [sort, page, searchBytes, animationsOn]
  );

  const rowLength = useGridRowLength();

  return (
    <>
      <ButtonsBlock
        className="mb-[30px]"
        value={page}
        onChange={handlePageChange}
        numPages={pages}
      />
      <OutermostContainer>
        <OuterContainer>
          <InnerGridContainer>
            <motion.div
              key={rowLength}
              id="emoji-grid-header"
              exit={{
                opacity: 0,
                transition: {
                  duration: 0.5,
                  type: "just",
                },
              }}
            >
              <SearchWrapper>
                <SearchBar />
              </SearchWrapper>
              <FilterOptionsWrapper>
                <FilterOptions
                  filter={sort ?? SortMarketsBy.MarketCap}
                  onChange={handleSortChange}
                />
              </FilterOptionsWrapper>
            </motion.div>
            {/* Each version of the grid must wait for the other to fully exit animate out before appearing.
                This provides a smooth transition from grids of varying row lengths. */}
            {markets.length > 0 ? (
              <>
                <AnimatePresence mode="wait">
                  <motion.div
                    className="relative w-full h-full"
                    id="emoji-grid"
                    key={rowLength}
                    style={{
                      // We set these so the grid layout doesn't snap when the number of items per row changes.
                      // This actually seems to work better than the css media queries, although I've left them in module.css
                      // in case we want to use them for other things.
                      maxWidth: rowLength * EMOJI_GRID_ITEM_WIDTH + GRID_PADDING * 2,
                      minWidth: rowLength * EMOJI_GRID_ITEM_WIDTH + GRID_PADDING * 2,
                    }}
                    exit={{
                      opacity: 0,
                      transition: {
                        duration: 0.35,
                        type: "just",
                      },
                    }}
                  >
                    <StyledGrid>
                      {shouldAnimateGrid ? (
                        <LiveClientGrid markets={markets} sortBy={sort} />
                      ) : (
                        <ClientGrid markets={markets} page={page} sortBy={sort} />
                      )}
                    </StyledGrid>
                  </motion.div>
                </AnimatePresence>
                <ButtonsBlock
                  className="mt-[30px]"
                  value={page}
                  onChange={handlePageChange}
                  numPages={pages}
                />
              </>
            ) : (
              <div className="py-10">
                <Link href={`${ROUTES.launch}?emojis=${emojis.join("")}`}>
                  <Text textScale="pixelHeading3" color="econiaBlue" className="uppercase">
                    Click here to launch {<Emoji emojis={emojis.join("")} />}
                  </Text>
                </Link>
              </div>
            )}
          </InnerGridContainer>
        </OuterContainer>
      </OutermostContainer>
    </>
  );
};

export default EmojiTable;
