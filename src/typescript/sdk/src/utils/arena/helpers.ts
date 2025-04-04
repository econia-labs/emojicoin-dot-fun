import type { AccountAddressInput, LedgerVersionArg, TypeTag } from "@aptos-labs/ts-sdk";

import { type SymbolEmoji, toMarketEmojiData } from "../../emoji_data";
import { EmojicoinArena, getMarketAddress, MarketView } from "../../emojicoin_dot_fun";
import { toEmojicoinTypesForEntry } from "../../markets/utils";
import { toMarketView } from "../../types";
import { toArenaMeleeEvent, toArenaRegistry } from "../../types/arena-types";
import { getAptosClient } from "../aptos-client";
import type { StrictXOR } from "../utility-types";

type ArenaSymbols = { symbol0: SymbolEmoji[]; symbol1: SymbolEmoji[] };
type ArenaMarketAddresses = {
  market0Address: AccountAddressInput;
  market1Address: AccountAddressInput;
};

/**
 * Converts two input symbols or addresses to the four coin type strings necessary for arena entry
 * functions.
 *
 * @returns
 * [Coin0, LP0, Coin1, LP1] as [CoinTypeString, CoinTypeString, CoinTypeString, CoinTypeString]
 */
export const toArenaCoinTypes = (args: StrictXOR<ArenaSymbols, ArenaMarketAddresses>) => {
  const [address0, address1] =
    "market0Address" in args
      ? [args.market0Address, args.market1Address]
      : [getMarketAddress(args.symbol0), getMarketAddress(args.symbol1)];

  return [...toEmojicoinTypesForEntry(address0), ...toEmojicoinTypesForEntry(address1)] as [
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
  const [symbol0, symbol1] = await Promise.all(
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
    symbol0: symbol0.emojis.map(({ emoji }) => emoji),
    symbol1: symbol1.emojis.map(({ emoji }) => emoji),
  });

  return {
    view,
    market0: {
      ...symbol0,
      typeTags: [coin0, lp0] as const,
    },
    market1: {
      ...symbol1,
      typeTags: [coin1, lp1] as const,
    },
  };
};

export type MeleeEmojiData = Awaited<ReturnType<typeof fetchMeleeEmojiData>>;

/**
 * Helper function to fetch all current melee data in a single call.
 */
export const fetchAllCurrentMeleeData = async () => {
  const registry = await fetchArenaRegistryView();
  const melee = await fetchArenaMeleeView(registry.currentMeleeID);
  const { market0, market1 } = await fetchMeleeEmojiData(melee);
  return {
    registry,
    melee,
    market0,
    market1,
  };
};
