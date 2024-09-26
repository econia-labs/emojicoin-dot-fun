import { type MarketStateModel } from "@sdk/indexer-v2/types";

export type TableRowDesktopProps = {
  item: MarketStateModel;
  selected?: boolean;
  onClick?: React.MouseEventHandler<HTMLTableRowElement> | undefined;
};
