import { type TypeTag } from "@aptos-labs/ts-sdk";
import { type SymbolEmoji } from "../emoji_data";
import { getMarketAddress } from "../emojicoin_dot_fun";
import { toCoinTypesForEntry } from "./utils";

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
