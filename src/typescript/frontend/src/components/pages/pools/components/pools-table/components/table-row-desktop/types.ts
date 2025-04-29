import type { PoolsData } from "app/pools/page";

export type TableRowDesktopProps = {
  item: PoolsData;
  selected?: boolean;
  onClick?: React.MouseEventHandler<HTMLTableRowElement> | undefined;
};
