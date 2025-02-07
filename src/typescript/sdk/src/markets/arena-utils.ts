import { type LedgerVersionArg, type TypeTag } from "@aptos-labs/ts-sdk";
import { toMarketEmojiData, type SymbolEmoji } from "../emoji_data";
import { EmojicoinArena, getMarketAddress, MarketView } from "../emojicoin_dot_fun";
import { toCoinTypesForEntry } from "./utils";
import { getAptosClient } from "../utils";
import { toArenaMeleeEvent, toArenaRegistry } from "../types/arena-types";
import { toMarketView } from "../types";

/**
 * Converts two input symbols to the four coin TypeTags necessary for arena entry functions.
 *
 * @param symbols.a the first symbol as an array of symbol emojis
 * @param symbols.b the second symbol as an array of symbol emojis
 *
 * @returns [Coin0, LP0, Coin1, LP1] as [TypeTag, TypeTag, TypeTag, TypeTag]
 */
export const toArenaCoinTypes = ({
  symbol1,
  symbol2,
}: {
  symbol1: SymbolEmoji[];
  symbol2: SymbolEmoji[];
}) => {
  const addressA = getMarketAddress(symbol1);
  const addressB = getMarketAddress(symbol2);

  return [...toCoinTypesForEntry(addressA), ...toCoinTypesForEntry(addressB)] as [
    TypeTag,
    TypeTag,
    TypeTag,
    TypeTag,
  ];
};

/**
 * Helper function to properly type each field for the `melee` view function.
 *
 * @param meleeID the melee ID
 * @param options view function options
 * @returns the Melee view/struct data, camelCased.
 */
export const fetchArenaMeleeView = async (meleeID: bigint, options?: LedgerVersionArg) =>
  EmojicoinArena.Melee.view({
    aptos: getAptosClient(),
    meleeID,
    options,
  })
    .then((res) => toArenaMeleeEvent(res, -1n, -1n))
    .then(({ version: _, eventIndex: __, ...melee }) => melee);

/**
 * Helper function to properly type each field for the `registry` view function.
 *
 * @param options view function options
 * @returns the Registry view data, camelCased.
 */
export const fetchArenaRegistryView = async (options?: LedgerVersionArg) =>
  EmojicoinArena.Registry.view({
    aptos: getAptosClient(),
    options,
  }).then(toArenaRegistry);

/**
 * Pass the return value of a melee view here to fetch the melee symbol data from on-chain, since
 * there's no way to go from `market_address` => `symbol_bytes` deterministically.
 *
 * @param view
 * @returns the emoji data for both symbols in the melee, along with the view data
 */
export const fetchMeleeEmojiData = async (
  view: Awaited<ReturnType<typeof fetchArenaMeleeView>>
) => {
  const [symbol1, symbol2] = await Promise.all(
    [view.emojicoin0MarketAddress, view.emojicoin1MarketAddress].map((marketAddress) =>
      MarketView.view({
        aptos: getAptosClient(),
        marketAddress,
      })
        .then(toMarketView)
        .then(({ metadata }) => ({
          marketID: metadata.marketID,
          marketAddress: metadata.marketAddress,
          ...toMarketEmojiData(metadata.emojiBytes),
        }))
    )
  );
  const [coin0, lp0, coin1, lp1] = toArenaCoinTypes({
    symbol1: symbol1.emojis.map(({ emoji }) => emoji),
    symbol2: symbol2.emojis.map(({ emoji }) => emoji),
  });

  return {
    view,
    market1: {
      ...symbol1,
      typeTags: [coin0, lp0] as [TypeTag, TypeTag],
    },
    market2: {
      ...symbol2,
      typeTags: [coin1, lp1] as [TypeTag, TypeTag],
    },
  };
};

export type MeleeEmojiData = Awaited<ReturnType<typeof fetchMeleeEmojiData>>;
