export type TableRowDesktopProps = {
  item: {
    rankIcon: string;
    rankName: string;
    apt: string;
    emoji: string;
    type: string;
    priceQ64: string;
    date: Date;
    version: number;
    swapper: string;
  };
  showBorder: boolean;
  index: number;
  numSwapsDisplayed: number;
  shouldAnimateAsInsertion?: boolean;
};
