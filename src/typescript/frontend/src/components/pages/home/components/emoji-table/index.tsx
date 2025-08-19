"use client";

import type { HomePageProps } from "app/home/HomePage";
import SearchBar from "components/inputs/search-bar";
import Text from "components/text";
import { useEmojiPicker } from "context/emoji-picker-context";
import { useEventStore, useUserSettings } from "context/event-store-context";
import { AnimatePresence, motion } from "framer-motion";
import { clientCookies } from "lib/cookie-user-settings/cookie-user-settings-client";
import { useFavoriteMarkets } from "lib/hooks/queries/use-get-favorites";
import { useSearchEmojisMarkets } from "lib/hooks/queries/use-search-emojis";
import { MARKETS_PER_PAGE } from "lib/queries/sorting/const";
import { constructURLForHomePage } from "lib/queries/sorting/query-params";
import { cn } from "lib/utils/class-name";
import getMaxPageNumber from "lib/utils/get-max-page-number";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useTransition } from "react";
import { ROUTES } from "router/routes";
import { Emoji } from "utils/emoji";

import { Separator } from "@/components/Separator";
import useEvent from "@/hooks/use-event";
import { useTailwindBreakpoints } from "@/hooks/use-tailwind-breakpoints";
import { SortMarketsBy } from "@/sdk/indexer-v2/types/common";

import { EMOJI_GRID_ITEM_WIDTH, MAX_WIDTH } from "../const";
import EmptyTableCard from "../table-card/EmptyTableCard";
import { LiveClientGrid } from "./AnimatedClientGrid";
import { ClientGrid } from "./ClientGrid";
import { ButtonsBlock } from "./components/buttons-block";
import SortAndAnimate from "./components/SortAndAnimate";
import { useGridRowLength } from "./hooks/use-grid-items-per-line";

interface EmojiTableProps
  extends Omit<HomePageProps, "featured" | "children" | "priceFeed" | "meleeData"> {}

const EmojiTable = (props: EmojiTableProps) => {
  const {
    favoritesQuery: { data: { markets: favoriteMarkets = [] } = {} },
  } = useFavoriteMarkets();

  const isFavoriteFilterEnabled = useMemo(() => {
    const favoritesInCookies = !!clientCookies.getSetting("homePageFilterFavorites");
    return favoritesInCookies && !!favoriteMarkets?.length;
  }, [favoriteMarkets?.length]);

  const router = useRouter();
  const emojis = useEmojiPicker((s) => s.emojis);

  const marketsSearched = useSearchEmojisMarkets({
    emojis,
    page: props.page,
    sortBy: props.sortBy,
    isFavoriteFilterEnabled,
  });

  const { markets, page, sort, pages } = useMemo(() => {
    const { page, sortBy: sort } = props;
    const numMarkets = Math.max(props.numMarkets, 1);
    const [markets, pages] = marketsSearched.length
      ? [marketsSearched, getMaxPageNumber(marketsSearched.length, MARKETS_PER_PAGE)]
      : isFavoriteFilterEnabled && favoriteMarkets
        ? [Array.from(favoriteMarkets), 1]
        : [props.markets, getMaxPageNumber(numMarkets, MARKETS_PER_PAGE)];
    return { markets, page, sort, pages };
  }, [props, isFavoriteFilterEnabled, favoriteMarkets, marketsSearched]);

  const { md } = useTailwindBreakpoints();

  const loadMarketStateFromServer = useEventStore((s) => s.loadMarketStateFromServer);

  // Use the prop value by default, but instantly set the new state
  // on the beginning of the transition when the toggle is switched.
  // This ref tracks the *optimistic* toggle value; that is, the value
  // that is expected but not asynchronously confirmed with cookies yet.
  const [isLoading, startTransition] = useTransition();
  const toggleStateRef = useRef(isFavoriteFilterEnabled);

  useEffect(() => {
    loadMarketStateFromServer(markets);
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [markets]);

  const pushURL = useEvent((args?: { page?: number; sort?: SortMarketsBy }) => {
    const newURL = constructURLForHomePage({
      page: args?.page ?? page,
      sort: args?.sort ?? sort,
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

  const animationsOn = useUserSettings((s) => s.animate);

  const shouldAnimateGrid = useMemo(
    () => animationsOn && sort === SortMarketsBy.BumpOrder && page === 1 && !emojis.length,
    [sort, page, emojis, animationsOn]
  );

  const rowLength = useGridRowLength();

  const emptyCells = useMemo(() => {
    const maxPossibleCells = Math.ceil(markets.length / rowLength) * rowLength;
    return maxPossibleCells - markets.length;
  }, [markets.length, rowLength]);

  // Update cookies and refresh the page.
  const setIsFilterFavorites = (newVal: boolean) => {
    // Note the usage of the ref here facilitates snappy transitions through the usage of
    // `startTransition` with `isLoading` and the final/ultimate ref value. This avoids
    // inadvertently capturing the stale value in a callback and using it; that is,
    // if a user toggles the switch multiple times, the ref is always immediately set,
    // and at the end of the transition, the ref is retrieved/used again, rather than
    // the value originally passed into the function.
    // This also works visually by using the ref value as the switch/toggle value
    // when `isLoading` is true.
    toggleStateRef.current = newVal;
    startTransition(() => {
      const curr = toggleStateRef.current;
      clientCookies.saveSetting("homePageFilterFavorites", curr);
      // A refresh of sorts. `router.refresh()` will invalidate the RSC cache and we don't really need that since it's
      // so expensive. Simply push the same URL and the page updates properly.
      pushURL();
    });
  };

  return (
    <>
      <ButtonsBlock
        className="mb-[30px]"
        value={page}
        onChange={handlePageChange}
        numPages={pages}
      />
      <div className="flex border-t border-solid border-dark-gray">
        <div className="flex justify-center w-full">
          <div
            className="flex flex-col items-center w-full justify-center"
            style={{ maxWidth: MAX_WIDTH + "px" }}
          >
            <motion.div
              key={rowLength}
              id="emoji-grid-header"
              // Note the custom media query here. 860px is used because it's almost exactly the breakpoint for when
              // the grid goes from 2 markets per row to 3. Using `md` here means there's too much room for two lines
              // for the search bar + filter/toggle switches, but using `lg` means there's a point (at 860px) when
              // there is not enough horizontal space. Hence the specific one-off media query used below.
              className={cn(
                "flex w-full max-w-[500px] flex-col",
                "justify-between items-center px-3 border-solid border-dark-gray",
                "min-[860px]:border-x min-[860px]:max-w-full min-[860px]:flex-row min-[860px]:justify-start"
              )}
              style={{
                width: md ? rowLength * EMOJI_GRID_ITEM_WIDTH : undefined,
              }}
              exit={{
                opacity: 0,
                transition: {
                  duration: 0.5,
                  type: "just",
                },
              }}
            >
              <div className="max-w-[350px] min-[860px]:max-w-[200px]">
                <SearchBar />
              </div>
              <SortAndAnimate
                sortMarketsBy={sort ?? SortMarketsBy.MarketCap}
                onSortChange={handleSortChange}
                isFilterFavorites={isLoading ? toggleStateRef.current : isFavoriteFilterEnabled}
                setIsFilterFavorites={setIsFilterFavorites}
                disableFavoritesToggle={isLoading}
              />
            </motion.div>
            <Separator />
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
                      maxWidth: rowLength * EMOJI_GRID_ITEM_WIDTH,
                      minWidth: rowLength * EMOJI_GRID_ITEM_WIDTH,
                    }}
                    exit={{
                      opacity: 0,
                      transition: {
                        duration: 0.35,
                        type: "just",
                      },
                    }}
                  >
                    <div
                      className="grid relative justify-center w-full gap-0"
                      style={{
                        gridTemplateColumns: `repeat(auto-fill, ${EMOJI_GRID_ITEM_WIDTH}px)`,
                      }}
                    >
                      {shouldAnimateGrid ? (
                        <LiveClientGrid
                          isFavoriteFilterEnabled={
                            isLoading ? toggleStateRef.current : isFavoriteFilterEnabled
                          }
                          markets={markets}
                          sortBy={sort}
                          page={page}
                        />
                      ) : (
                        <ClientGrid markets={markets} page={page} sortBy={sort} />
                      )}
                      {!!emptyCells &&
                        Array.from({ length: emptyCells }).map((_, i) => (
                          <EmptyTableCard
                            key={`empty-table-card-${sort}-${page - 1 * MARKETS_PER_PAGE + (markets.length - 1 + i)}`}
                            index={markets.length - 1 + i}
                            rowLength={rowLength}
                            pageOffset={page - 1 * MARKETS_PER_PAGE}
                            sortBy={sort}
                          />
                        ))}
                    </div>
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
          </div>
        </div>
      </div>
    </>
  );
};

export default EmojiTable;
