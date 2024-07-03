import { type Types } from "@sdk-types";
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

export const getRankFromSwapEvent = (
  amount: number | bigint
): {
  rankIcon: RankIcon;
  rankName: RankName;
} => {
  if (Number(amount) < 5) {
    return {
      rankIcon: RankIcon.n00b,
      rankName: RankName.n00b,
    };
  }
  if (Number(amount) < 20) {
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

/**
 * Gets the denoted rank based on the user's balance as a fraction of circulating supply.
 * @param chat the chat event
 * @returns the rank icon and name
 */
export const getRankFromChatEvent = (chat: Types.ChatEvent) => {
  const fraction = q64ToBig(chat.balanceAsFractionOfCirculatingSupply).toNumber();
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
