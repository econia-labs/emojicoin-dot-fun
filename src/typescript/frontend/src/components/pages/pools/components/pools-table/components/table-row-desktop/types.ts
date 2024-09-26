import { type PoolsData } from "components/pages/pools/ClientPoolsPage";

export type TableRowDesktopProps = {
  item: PoolsData;
  selected?: boolean;
  onClick?: React.MouseEventHandler<HTMLTableRowElement> | undefined;
};
