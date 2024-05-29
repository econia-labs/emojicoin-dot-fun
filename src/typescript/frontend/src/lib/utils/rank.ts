import { RankIcon, RankName } from "components/pages/emojicoin/components/trade-history/constants";

export const rankFromAPTAmount = (
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
  } else if (Number(amount) < 20) {
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
