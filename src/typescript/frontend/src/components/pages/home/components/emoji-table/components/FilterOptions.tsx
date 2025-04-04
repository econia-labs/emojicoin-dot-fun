import { DropdownMenu, SingleSelect } from "components/selects";
import type { Option } from "components/selects/types";
import { Switcher } from "components/switcher";
import Text from "components/text";
import { useUserSettings } from "context/event-store-context";
import { translationFunction } from "context/language-context";
import { useAptos } from "context/wallet-context/AptosContextProvider";
import { useMatchBreakpoints } from "hooks";
import { getSetting, saveSetting } from "lib/cookie-user-settings/cookie-user-settings";
import FEATURE_FLAGS from "lib/feature-flags";
import { useEffect, useState } from "react";

import { FlexGap } from "@/containers";
import { SortMarketsBy } from "@/sdk/indexer-v2/types/common";

import { StyledTHFilters } from "../styled";

const titleFromValue: Record<SortMarketsBy, string> = {
  [SortMarketsBy.MarketCap]: "Market Cap",
  [SortMarketsBy.BumpOrder]: "Bump Order",
  [SortMarketsBy.DailyVolume]: "24h Volume",
  [SortMarketsBy.AllTimeVolume]: "Alltime Vol",
  [SortMarketsBy.Price]: "Price",
  [SortMarketsBy.Apr]: "APR",
  [SortMarketsBy.Tvl]: "TVL",
};

const options: Array<Option> = [
  { title: titleFromValue[SortMarketsBy.MarketCap], value: SortMarketsBy.MarketCap },
  { title: titleFromValue[SortMarketsBy.BumpOrder], value: SortMarketsBy.BumpOrder },
  { title: titleFromValue[SortMarketsBy.DailyVolume], value: SortMarketsBy.DailyVolume },
  { title: titleFromValue[SortMarketsBy.AllTimeVolume], value: SortMarketsBy.AllTimeVolume },
  // TODO: Add price..?
];

type FilterOptionsComponentProps = {
  filter: SortMarketsBy;
  onChange: (value: SortMarketsBy) => void;
};

const FilterOptionsComponent = ({ filter, onChange }: FilterOptionsComponentProps) => {
  const selectedOption = options.find((x) => x.value === filter)!;
  const { t } = translationFunction();
  const { isLaptopL } = useMatchBreakpoints();
  const animate = useUserSettings((s) => s.animate);
  const toggleAnimate = useUserSettings((s) => s.toggleAnimate);
  const { account } = useAptos();

  const [isFilterFavorites, setIsFilterFavorites] = useState(false);

  useEffect(() => {
    getSetting("homePageFilterFavorites").then((res) => setIsFilterFavorites(res || false));
  }, []);

  const toggleFavorites = () => {
    saveSetting("homePageFilterFavorites", !isFilterFavorites);
    setIsFilterFavorites((prev) => !prev);
  };

  return (
    <StyledTHFilters>
      <SingleSelect
        wrapperProps={{
          width: isLaptopL ? "300px" : "unset",
          marginRight: isLaptopL ? "inherit" : "20px",
          className: "med-pixel-text",
        }}
        title={selectedOption?.title}
        value={selectedOption}
        setValue={(option) => {
          onChange(option.value as SortMarketsBy);
        }}
        dropdownComponent={DropdownMenu}
        onHover={(_) => {}}
        options={options}
        dropdownWrapperProps={{ width: "250px" }}
        titleProps={{ color: "darkGray", textTransform: "uppercase" }}
        placeholderProps={{
          textTransform: "uppercase",
          color: "lightGray",
          className: "med-pixel-text",
        }}
        placeholder="Sort:"
      />

      <div className="flex flex-row gap-4">
        {account?.address && FEATURE_FLAGS.Favorites && (
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
        )}

        <FlexGap gap="12px" className={"med-pixel-text"}>
          <Text className={"med-pixel-text"} color="lightGray" textTransform="uppercase">
            {t("Animate:")}
          </Text>

          <Switcher checked={animate} onChange={toggleAnimate} scale={isLaptopL ? "md" : "sm"} />
        </FlexGap>
      </div>
    </StyledTHFilters>
  );
};

export default FilterOptionsComponent;
