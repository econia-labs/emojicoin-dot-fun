import { createHomePageURL } from "lib/queries/sorting/query-params";
import { cn } from "lib/utils/class-name";
import Link from "next/link";
import { useState } from "react";
import { useScramble } from "use-scramble";

import {
  DropdownArrow,
  DropdownContent,
  DropdownMenu,
  DropdownTrigger,
} from "@/components/dropdown-menu";
import ScrambledDropdownItem from "@/components/dropdown-menu/ScrambledDropdownItem";
import { SortMarketsBy } from "@/sdk/indexer-v2/types/common";

import { useHomePageUrlParams } from "../../../hooks/use-url-params";

type HomePageSortOptions = keyof typeof sortOptions;
type OptionLabel = (typeof sortOptions)[HomePageSortOptions];

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

const sortOptionsEntries = Object.entries(sortOptions) as [HomePageSortOptions, OptionLabel][];

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

  const { page } = useHomePageUrlParams();

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
            <span
              className="text-dark-gray"
              // Ensure min width based on the text scrambled so the container size doesn't change rapidly on scramble.
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
          <Link
            href={createHomePageURL({ page, sort: choice })}
            key={`sort-home-dropdown-${choice}`}
            aria-label={`sort by ${choice}, page ${page}`}
          >
            <ScrambledDropdownItem
              onSelect={() => {
                onSortChange(choice);
              }}
              scrambleText={title}
              className="flex justify-center"
              rowWrapperClassName="w-full"
            />
            {i < sortOptionsEntries.length - 1 && (
              <div className="border-b-2 border-dashed border-b-black" />
            )}
          </Link>
        ))}
      </DropdownContent>
    </DropdownMenu>
  );
}
