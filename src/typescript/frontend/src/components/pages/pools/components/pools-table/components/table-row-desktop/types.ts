import type { FetchSortedMarketDataReturn } from "lib/queries/sorting/market-data";

export type TableRowDesktopProps = {
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  item: FetchSortedMarketDataReturn["markets"][0];
  selected?: boolean;
  onClick?: React.MouseEventHandler<HTMLTableRowElement> | undefined;
};
