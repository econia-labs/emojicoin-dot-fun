import { type AnyNumberString } from "@sdk-types";

export type TableRowDesktopProps = {
  item: {
    rankIcon: string;
    rankName: string;
    apt: string;
    emoji: string;
    type: string;
    priceQ64: string;
    date: Date;
    version: AnyNumberString;
    swapper: string;
  };
  showBorder: boolean;
  index: number;
  numSwapsDisplayed: number;
  shouldAnimateAsInsertion?: boolean;
};
