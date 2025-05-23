import { useUserSettings } from "context/event-store-context";
import { translationFunction } from "context/language-context";
import { useAptos } from "context/wallet-context/AptosContextProvider";
import FEATURE_FLAGS from "lib/feature-flags";
import { useGetFavoriteMarkets } from "lib/hooks/queries/use-get-favorites";
import { cn } from "lib/utils/class-name";

import { FlexGap } from "@/components/layout";
import Popup from "@/components/popup";
import { Switcher } from "@/components/switcher";
import Text from "@/components/text";
import useMatchBreakpoints from "@/hooks/use-match-breakpoints/use-match-breakpoints";

import styles from "../ExtendedGridLines.module.css";
import type { SortHomePageDropdownProps } from "./SortHomePageDropdown";
import SortHomePageDropdown from "./SortHomePageDropdown";

interface Props extends SortHomePageDropdownProps {
  isFilterFavorites: boolean;
  setIsFilterFavorites: (value: boolean) => void;
}

export default function SortAndAnimate({
  sortMarketsBy,
  onSortChange,
  isFilterFavorites,
  setIsFilterFavorites,
}: Props) {
  const animate = useUserSettings((s) => s.animate);
  const toggleAnimate = useUserSettings((s) => s.toggleAnimate);
  const { isLaptopL } = useMatchBreakpoints();
  const { t } = translationFunction();

  const { account } = useAptos();
  const {
    favoritesQuery: { data: favorites },
  } = useGetFavoriteMarkets();

  const favoritesDisabled = !favorites || favorites.size === 0;

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
            "flex items-center w-full justify-around md:justify-between p-[10px] gap-3",
            "md:p-0 md:w-[unset]"
          )}
        >
          <SortHomePageDropdown sortMarketsBy={sortMarketsBy} onSortChange={onSortChange} />
          {account?.address && FEATURE_FLAGS.Favorites && (
            <Popup
              content={
                favoritesDisabled
                  ? "Add an Emojicoin to your favorites to use this filter"
                  : "Filter your favorite Emojicoins"
              }
            >
              <FlexGap gap="12px" className={"med-pixel-text"}>
                <Text className={"med-pixel-text"} color="lightGray" textTransform="uppercase">
                  {t("Favorites:")}
                </Text>

                <Switcher
                  disabled={favoritesDisabled}
                  checked={!favoritesDisabled && isFilterFavorites}
                  onChange={() => setIsFilterFavorites(!isFilterFavorites)}
                  scale={isLaptopL ? "md" : "sm"}
                />
              </FlexGap>
            </Popup>
          )}
          <div className="flex flex-row gap-3">
            <span className=" med-pixel-text text-light-gray uppercase">Animate: </span>
            <Switcher checked={animate} onChange={toggleAnimate} scale={isLaptopL ? "md" : "sm"} />
          </div>
        </div>
      </div>
    </>
  );
}
