import { useUserSettings } from "context/event-store-context";
import { translationFunction } from "context/language-context";
import { getSetting, saveSetting } from "lib/cookie-user-settings/cookie-user-settings";
import { cn } from "lib/utils/class-name";
import { useEffect, useState } from "react";

import { FlexGap } from "@/components/layout";
import { Switcher } from "@/components/switcher";
import Text from "@/components/text";
import useMatchBreakpoints from "@/hooks/use-match-breakpoints/use-match-breakpoints";

import styles from "../ExtendedGridLines.module.css";
import type { SortHomePageDropdownProps } from "./SortHomePageDropdown";
import SortHomePageDropdown from "./SortHomePageDropdown";

export default function SortAndAnimate({ sortMarketsBy, onSortChange }: SortHomePageDropdownProps) {
  const animate = useUserSettings((s) => s.animate);
  const toggleAnimate = useUserSettings((s) => s.toggleAnimate);
  const { isLaptopL } = useMatchBreakpoints();
  const { t } = translationFunction();

  const [isFilterFavorites, setIsFilterFavorites] = useState(false);

  useEffect(() => {
    getSetting("homePageFilterFavorites").then((res) => setIsFilterFavorites(res || false));
  }, []);

  const toggleFavorites = () => {
    saveSetting("homePageFilterFavorites", !isFilterFavorites);
    setIsFilterFavorites((prev) => !prev);
  };

  return (
    <>
      {/* Outer wrapper. */}
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
          <SortHomePageDropdown sortMarketsBy={sortMarketsBy} onSortChange={onSortChange} />
          <FlexGap gap="12px" className={"med-pixel-text"}>
            <Text className={"med-pixel-text"} color="lightGray" textTransform="uppercase">
              {t("Favorites:")}
            </Text>

            <Switcher
              checked={isFilterFavorites || false}
              onChange={toggleFavorites}
              scale={isLaptopL ? "md" : "sm"}
            />
          </FlexGap>
          <div className="flex flex-row gap-3">
            <span className=" med-pixel-text text-light-gray uppercase">Animate: </span>
            <Switcher checked={animate} onChange={toggleAnimate} scale={isLaptopL ? "md" : "sm"} />
          </div>
        </div>
      </div>
    </>
  );
}
