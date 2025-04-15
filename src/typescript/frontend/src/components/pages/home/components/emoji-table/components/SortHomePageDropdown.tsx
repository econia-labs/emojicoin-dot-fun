import { DropdownMenu } from "@radix-ui/react-dropdown-menu";
import { cn } from "lib/utils/class-name";
import { useState } from "react";
import { useScramble } from "use-scramble";

import { DropdownArrow, DropdownContent, DropdownTrigger } from "@/components/dropdown-menu";
import ScrambledDropdownItem from "@/components/dropdown-menu/ScrambledDropdownItem";
import { SortMarketsBy } from "@/sdk/indexer-v2/types/common";

type HomePageSortOptions = keyof typeof sortOptions;

export type SortHomePageDropdownProps = {
  sortMarketsBy: HomePageSortOptions;
  onSortChange: (value: HomePageSortOptions) => void;
};

const sortOptions = {
  [SortMarketsBy.MarketCap]: "Market Cap",
  [SortMarketsBy.BumpOrder]: "Bump Order",
  [SortMarketsBy.DailyVolume]: "24h Volume",
  [SortMarketsBy.AllTimeVolume]: "All-Time Vol",
} as const;

const sortOptionsEntries = Object.entries(sortOptions);

export default function SortHomePageDropdown({
  sortMarketsBy,
  onSortChange,
}: SortHomePageDropdownProps) {
  const [scrambleEnabled, setScrambleEnabled] = useState(true);
  const { ref, replay } = useScramble({
    text: sortOptions[sortMarketsBy],
    overdrive: false,
    speed: 0.6,
    playOnMount: false,
    onAnimationStart: () => setScrambleEnabled(false),
    onAnimationEnd: () => setScrambleEnabled(true),
  });

  return (
    <DropdownMenu>
      <DropdownTrigger asChild className="focus:outline-none">
        <button className="flex w-[unset] xl:w-[300px] mr-[20px]">
          <div
            className="flex flex-row uppercase med-pixel-text gap-2 whitespace-nowrap"
            onMouseOver={() => {
              if (scrambleEnabled) replay();
            }}
          >
            <span className="text-dark-gray">{"{"}</span>
            <span className="text-light-gray">Sort:</span>
            {/* Min 12 chars because that's the length of the longest sort option.
                This makes the div not resize while scrambling. */}
            <span
              className="text-dark-gray"
              style={{ minWidth: `${sortOptions[sortMarketsBy].length + 0.5}ch` }}
              ref={ref}
            />
            <span className="text-dark-gray">{"}"}</span>
          </div>
        </button>
      </DropdownTrigger>
      <DropdownContent
        sideOffset={4}
        className={cn(
          "flex flex-col bg-ec-blue text-black med-pixel-text uppercase cursor-pointer z-[50]",
          "rounded-[3px] w-52 xl:w-64"
        )}
        align="center"
        side="bottom"
      >
        <DropdownArrow className="fill-ec-blue" visibility="visible" />
        {sortOptionsEntries.map(([choice, title], i) => (
          <>
            <ScrambledDropdownItem
              key={`sort-home-dropdown-${choice}`}
              onSelect={() => {
                onSortChange(choice as HomePageSortOptions);
              }}
              scrambleText={title}
              className="flex justify-center"
              rowWrapperClassName="w-full"
            />
            {i < sortOptionsEntries.length - 1 && (
              <div className="border-b-2 border-dashed border-b-black" />
            )}
          </>
        ))}
      </DropdownContent>
    </DropdownMenu>
  );
}
