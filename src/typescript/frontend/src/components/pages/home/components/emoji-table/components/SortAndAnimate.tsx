import { useUserSettings } from "context/event-store-context";
import { cn } from "lib/utils/class-name";

import { Switcher } from "@/components/switcher";
import useMatchBreakpoints from "@/hooks/use-match-breakpoints/use-match-breakpoints";

import styles from "../ExtendedGridLines.module.css";
import type { SortHomePageDropdownProps } from "./SortHomePageDropdown";
import SortHomePageDropdown from "./SortHomePageDropdown";

export default function SortAndAnimate({ sortMarketsBy, onSortChange }: SortHomePageDropdownProps) {
  const animate = useUserSettings((s) => s.animate);
  const toggleAnimate = useUserSettings((s) => s.toggleAnimate);

  const { isLaptopL } = useMatchBreakpoints();

  return (
    // Outer wrapper.
    <div
      className={cn(
        styles["extended-grid-lines"],
        "w-full border-none ml-0 mr-0 pr-0 after:right-0",
        "justify-end pr-5 md:border-r md:border-solid md:border-r-dark-gray"
      )}
    >
      {/* Inner wrapper. */}
      <div
        className={cn(
          "flex items-center w-full justify-around md:justify-between p-[10px]",
          "md:p-0 md:w-[unset]"
        )}
      >
        <div className="w-fit">
          <SortHomePageDropdown sortMarketsBy={sortMarketsBy} onSortChange={onSortChange} />
        </div>

        {/* Animate switcher. */}
        <div className="flex flex-row gap-3">
          <span className=" med-pixel-text text-light-gray uppercase">Animate: </span>
          <Switcher checked={animate} onChange={toggleAnimate} scale={isLaptopL ? "md" : "sm"} />
        </div>
      </div>
    </div>
  );
}
