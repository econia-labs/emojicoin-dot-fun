import ClientEmojicoinPage from "components/pages/emojicoin/ClientEmojicoinPage";
import { AptPriceContextProvider } from "context/AptPrice";
import ArenaInfoLoader from "context/ArenaInfoLoader";
import { getPrebuildFileData } from "lib/nextjs/prebuild";
import { fetchLongerCachedArenaInfo } from "lib/queries/arena-info";
import { fetchCachedAptPrice } from "lib/queries/get-apt-price";
import { GENERATE_ALL_STATIC_PAGES } from "lib/server-env";
import type { Metadata } from "next";
import { emojiNamesToPath, pathToEmojiNames } from "utils/pathname-helpers";

import { fetchAllMarkets } from "@/queries/static-params";
import type { SymbolEmoji, SymbolEmojiName } from "@/sdk/emoji_data";
import { SYMBOL_EMOJI_DATA } from "@/sdk/emoji_data";
import { isValidMarketSymbol, toMarketStateModel } from "@/sdk/index";

import { fetchCachedMarketState } from "../cached-fetches";
import { maybeGetMarketPrebuildData } from "../prebuild-data";
import EmojiNotFoundPage from "./not-found";

export const revalidate = 10;
export const dynamic = "force-static";
export const dynamicParams = true;

export async function generateStaticParams() {
  // if (GENERATE_ALL_STATIC_PAGES) {

  // }
  const maybePrebuildData = getPrebuildFileData();
  const maybeMarketData = maybePrebuildData ? Object.values(maybePrebuildData.markets) : undefined;
  const markets = maybeMarketData ?? (await fetchAllMarkets());
  const paths = markets
    .map((mkt) => mkt.symbol_emojis)
    .map((emojis) => emojis.map((emoji) => SYMBOL_EMOJI_DATA.byEmojiStrict(emoji).name))
    .map(emojiNamesToPath)
    .map((path) => ({ market: path }));
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
  const emojis = names.map((v) => SYMBOL_EMOJI_DATA.byStrictName(v).emoji);
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
  const names: SymbolEmojiName[] = [];
  const emojis: SymbolEmoji[] = [];
  try {
    names.push(...pathToEmojiNames(marketSlug));
    emojis.push(...names.map((v) => SYMBOL_EMOJI_DATA.byStrictName(v).emoji));
    const isValid = isValidMarketSymbol(emojis.join(""));
    if (!isValid) {
      return <EmojiNotFoundPage />;
    }
  } catch (e) {
    return <EmojiNotFoundPage />;
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
