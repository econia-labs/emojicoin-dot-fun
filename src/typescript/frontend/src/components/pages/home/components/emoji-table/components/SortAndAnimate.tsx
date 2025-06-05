import { useUserSettings } from "context/event-store-context";
import { translationFunction } from "context/language-context";
import { useAptos } from "context/wallet-context/AptosContextProvider";
import FEATURE_FLAGS from "lib/feature-flags";
import { useGetFavoriteMarkets } from "lib/hooks/queries/use-get-favorites";

import Popup from "@/components/popup";
import { Switch } from "@/components/ui/Switch";

import type { SortHomePageDropdownProps } from "./SortHomePageDropdown";
import SortHomePageDropdown from "./SortHomePageDropdown";

interface Props extends SortHomePageDropdownProps {
  isFilterFavorites: boolean;
  setIsFilterFavorites: (value: boolean) => void;
  disableFavoritesToggle: boolean;
}

export default function SortAndAnimate({
  sortMarketsBy,
  onSortChange,
  isFilterFavorites,
  setIsFilterFavorites,
  disableFavoritesToggle,
}: Props) {
  const animate = useUserSettings((s) => s.animate);
  const toggleAnimate = useUserSettings((s) => s.toggleAnimate);
  const { t } = translationFunction();

  const { account } = useAptos();
  const {
    favoritesQuery: { data: favorites },
  } = useGetFavoriteMarkets();

  const favoritesDisabled = !favorites || favorites.size === 0;

  return (
    <div
      className={
        "flex w-full flex-col md:flex-row justify-between md:justify-end py-2 items-center gap-3"
      }
    >
      <SortHomePageDropdown sortMarketsBy={sortMarketsBy} onSortChange={onSortChange} />
      <div className="flex gap-3">
        {account?.address && FEATURE_FLAGS.Favorites && (
          <Popup
            content={
              disableFavoritesToggle
                ? "Loading..."
                : favoritesDisabled
                  ? "Add an Emojicoin to your favorites to use this filter"
                  : "Filter your favorite Emojicoins"
            }
          >
            <div className="flex gap-3 items-center">
              <span className="med-pixel-text text-light-gray uppercase">{t("Favorites:")}</span>
              <Switch
                disabled={disableFavoritesToggle || favoritesDisabled}
                checked={!favoritesDisabled && isFilterFavorites}
                onCheckedChange={() => setIsFilterFavorites(!isFilterFavorites)}
              />
            </div>
          </Popup>
        )}

        <div className="flex flex-row gap-3 items-center">
          <span className=" med-pixel-text text-light-gray uppercase">{t("Animate: ")}</span>
          <Switch checked={animate} onCheckedChange={toggleAnimate} />
        </div>
      </div>
    </div>
  );
}
