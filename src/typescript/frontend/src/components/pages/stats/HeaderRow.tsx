import Info from "components/info";
import { StatsColumn } from "./params";
import { SortableHeader } from "./SortableHeader";
import { ServerSideEmoji } from "./ServerSideEmoji";
import { cn } from "lib/utils/class-name";

/**
 * There's not really a better way to use a fixed header row in a table with pure CSS, so unfortunately this looks
 * very convoluted, but it's really just using a sticky table header row with a pseudo-element to ensure the border
 * moves with the sticky header content.
 *
 * @see {@link https://stackoverflow.com/a/47923622/2142219}
 */
export const TableHeaders = (props: {
  sort: StatsColumn;
  desc: boolean;
  baseUrl: string | null;
  emojiFontClassName: string;
}) => {
  return (
    <thead
      className={cn(
        "text-white font-forma tracking-wide text-md whitespace-nowrap",
        "sticky top-[-1px] z-1 bg-very-dark-gray",
        "[&_th]:sticky [&_th]:border-[1px] [&_th]:border-solid [&_th]:border-dark-gray",
        "[&_th]:border-t-0 [&_th]:border-b-0",
        "[&_th]:before:absolute [&_th]:before:top-0 [&_th]:before:left-0 [&_th]:before:w-full [&_th]:before:h-[1px]",
        "[&_th]:after:absolute [&_th]:after:bottom-0 [&_th]:after:left-0 [&_th]:after:w-full [&_th]:after:h-[1px]",
        "[&_th]:before:bg-dark-gray [&_th]:after:bg-dark-gray",
      )}
    >
      <tr className="">
        <th>{"symbol"}</th>
        <SortableHeader {...props} header={StatsColumn.PriceDelta} text="24h delta" />
        <th>
          <div className="flex flex-row gap-[6px] justify-center">
            <span>{"price"}</span>
            <Info imageClassName="h-[16px]">
              {"This is the exact current price on the AMM curve. It's the price you'd get if you could buy or sell " +
                "an infinitesimally small amount. Calculus! "}
              <ServerSideEmoji emojiFontClassName={props.emojiFontClassName} emojis={"🤓"} />
            </Info>
          </div>
        </th>
        <SortableHeader {...props} header={StatsColumn.AllTimeVolume} aptosIcon />
        <SortableHeader {...props} header={StatsColumn.DailyVolume} aptosIcon />
        <SortableHeader {...props} header={StatsColumn.Tvl} aptosIcon />
        <SortableHeader {...props} header={StatsColumn.LastAvgPrice} />
        <SortableHeader {...props} header={StatsColumn.MarketCap} aptosIcon />
        <th>{"circulating supply"}</th>
        <th>{"bonding curve"}</th>
        <th>{"market id"}</th>
      </tr>
    </thead>
  );
};
