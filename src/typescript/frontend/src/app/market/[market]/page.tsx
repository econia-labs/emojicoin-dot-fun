import { generateHomePageStaticParams } from "app/home/static-params";
import ClientEmojicoinPage from "components/pages/emojicoin/ClientEmojicoinPage";
import { AptPriceContextProvider } from "context/AptPrice";
import ArenaInfoLoader from "context/ArenaInfoLoader";
import { fetchLongerCachedArenaInfo } from "lib/queries/arena-info";
import { fetchCachedAptPrice } from "lib/queries/get-apt-price";
import { MARKETS_PER_PAGE } from "lib/queries/sorting/const";
import { GENERATE_ALL_STATIC_PAGES } from "lib/server-env";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { emojiNamesToPath, pathToEmojiNames } from "utils/pathname-helpers";

import { fetchMarketsJson } from "@/queries/home";
import { fetchAllMarkets } from "@/queries/static-params";
import { SYMBOL_EMOJI_DATA } from "@/sdk/emoji_data";
import type { DatabaseJsonType } from "@/sdk/index";
import { isValidMarketSymbol, toMarketStateModel } from "@/sdk/index";
import { ORDER_BY } from "@/sdk/indexer-v2";

import { fetchCachedMarketState } from "../cached-fetches";
import { maybeGetMarketPrebuildData } from "../prebuild-data";
import EmojiNotFoundPage from "./not-found";

export const revalidate = 10;
export const dynamic = "force-static";
export const dynamicParams = true;

export async function generateStaticParams() {
  const markets = GENERATE_ALL_STATIC_PAGES
    ? await fetchAllMarkets()
    : // Or just generate all the market pages for each type of sorted home page that's statically built.
      // Note these fetches are cached and can be stale since the main purpose is to generate the market slug, which
      // never changes per market.
      await (async () => {
        const res: DatabaseJsonType["market_state"][] = [];
        const seen = new Set();

        for (const { sort, page } of await generateHomePageStaticParams()) {
          const moreMarkets = await fetchMarketsJson({
            page: Number(page),
            sortBy: sort,
            orderBy: ORDER_BY.DESC,
            pageSize: MARKETS_PER_PAGE,
          });
          const filtered = moreMarkets.filter((v) => !seen.has(v.symbol_bytes));
          filtered.forEach((v) => seen.add(v.symbol_bytes));
          res.push(...filtered);
        }
        return res;
      })();

  const paths = markets
    .map((mkt) => mkt.symbol_emojis)
    .map((emojis) => emojis.map((emoji) => SYMBOL_EMOJI_DATA.byEmojiStrict(emoji).name))
    .map(emojiNamesToPath)
    .map((path) => ({ market: decodeURIComponent(path) }));
  return paths;
}

/**
 * Our queries work with the marketID, but the URL uses the emoji bytes with a URL encoding.
 * That is, if you paste the emoji 💅🏾 into the URL, it becomes %F0%9F%92%85%F0%9F%8F%BE.
 * Whereas the actual emoji bytes are: 0xf09f9285f09f8fbe.
 */
type StaticParams = {
  market: string;
};

interface EmojicoinPageProps {
  params: StaticParams;
  searchParams: {};
}

const logAndReturnValue = <T extends [] | undefined | null>(dataType: string, onFailure: T) => {
  console.warn(`[WARNING]: Failed to fetch ${dataType}.`);
  return onFailure;
};

export async function generateMetadata({ params }: EmojicoinPageProps): Promise<Metadata> {
  const { market: marketSlug } = params;
  const names = pathToEmojiNames(marketSlug);
  const emojis = names.map((n) => {
    const res = SYMBOL_EMOJI_DATA.byName(n)?.emoji;
    if (!res) {
      console.warn(`Cannot parse invalid emoji input: ${marketSlug}, names: ${names}`);
      notFound();
    }
    return res;
  });
  const title = `${emojis.join("")}`;
  const description = `Trade ${emojis.join("")} on emojicoin.fun !`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
    },
    twitter: {
      title,
      description,
    },
  };
}

/**
 * Note that our queries work with the marketID, but the URL uses the emoji bytes with a URL encoding.
 * That is, if you paste the emoji 💅🏾 into the URL, it becomes %F0%9F%92%85%F0%9F%8F%BE.
 * Whereas the actual emoji bytes are: 0xf09f9285f09f8fbe.
 */
const EmojicoinPage = async (params: EmojicoinPageProps) => {
  const { market: marketSlug } = params.params;
  const names = pathToEmojiNames(marketSlug);
  const emojis = names.map((n) => {
    const res = SYMBOL_EMOJI_DATA.byName(n)?.emoji;
    if (!res) {
      console.warn(`Cannot parse invalid emoji input: ${marketSlug}, names: ${names}`);
      return notFound();
    }
    return res;
  });

  if (!isValidMarketSymbol(emojis.join(""))) {
    console.warn(`Invalid market symbol: ${emojis.join("")}`);
    return notFound();
  }

  const marketPrebuildData = maybeGetMarketPrebuildData(emojis);

  const stateJson =
    marketPrebuildData?.stateJson ?? (await fetchCachedMarketState({ searchEmojis: emojis }));

  if (stateJson) {
    const state = toMarketStateModel(stateJson);

    const [arenaInfo, aptPrice] = marketPrebuildData
      ? [marketPrebuildData.arenaInfo, marketPrebuildData.aptPrice]
      : await Promise.all([
          fetchLongerCachedArenaInfo().catch(() => logAndReturnValue("Arena info", null)),
          fetchCachedAptPrice().catch(() => logAndReturnValue("APT price", undefined)),
        ]);

    return (
      <AptPriceContextProvider aptPrice={aptPrice}>
        <ArenaInfoLoader arenaInfoJson={arenaInfo} />
        <ClientEmojicoinPage
          data={{
            symbol: state.market.symbolData.symbol,
            state,
            ...state.market,
          }}
        />
      </AptPriceContextProvider>
    );
  }

  return <EmojiNotFoundPage />;
};

export default EmojicoinPage;
