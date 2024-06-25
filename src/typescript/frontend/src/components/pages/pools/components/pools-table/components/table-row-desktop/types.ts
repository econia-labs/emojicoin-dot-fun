import type fetchSortedMarketData from "lib/queries/sorting/market-data";

export type TableRowDesktopProps = {
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  item: Awaited<ReturnType<typeof fetchSortedMarketData>>["markets"][0];
  selected?: boolean;
  onClick?: React.MouseEventHandler<HTMLTableRowElement> | undefined;
};
