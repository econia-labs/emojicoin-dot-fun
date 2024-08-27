import { isSwapEvent, type Types } from "@sdk-types";
import { q64ToBig } from "@sdk/utils/nominal-price";

export enum RankIcon {
  based = "🐳",
  n00b = "🐡",
  lfg = "🐬",
}

export enum RankName {
  based = "based",
  n00b = "n00b",
  lfg = "lfg",
}

/**
 * Gets the denoted rank based on the user's balance as a fraction of circulating supply.
 * @param event the chat or swap event
 * @returns the rank icon and name
 */
export const getRankFromEvent = (
  event: Types.SwapEvent | Types.ChatEvent
): {
  rankIcon: RankIcon;
  rankName: RankName;
} => {
  const fraction = (() => {
    if (isSwapEvent(event)) {
      const q64 = event.balanceAsFractionOfCirculatingSupplyAfterQ64;
      return q64ToBig(q64).toNumber();
    }
    const q64 = event.balanceAsFractionOfCirculatingSupply;
    return q64ToBig(q64).toNumber();
  })();

  const percentage = fraction * 100;

  if (percentage < 5) {
    return {
      rankIcon: RankIcon.n00b,
      rankName: RankName.n00b,
    };
  }
  if (percentage < 20) {
    return {
      rankIcon: RankIcon.lfg,
      rankName: RankName.lfg,
    };
  }
  return {
    rankIcon: RankIcon.based,
    rankName: RankName.based,
  };
};
