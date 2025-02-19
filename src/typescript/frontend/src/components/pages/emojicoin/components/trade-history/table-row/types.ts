import { type AnyNumberString } from "@sdk-types";

export type TableRowDesktopProps = {
  item: {
    rankIcon: string;
    rankName: string;
    apt: bigint;
    emoji: bigint;
    type: "buy" | "sell";
    priceQ64: bigint;
    date: Date;
    version: AnyNumberString;
    swapper: string;
  };
  showBorder: boolean;
  index: number;
  numSwapsDisplayed: number;
  shouldAnimateAsInsertion?: boolean;
};
