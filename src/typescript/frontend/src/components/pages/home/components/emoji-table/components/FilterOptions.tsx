import { FlexGap } from "@containers";
import { SingleSelect, DropdownMenu } from "components/selects";
import { Switcher } from "components/switcher";
import { translationFunction } from "context/language-context";
import { StyledTHFilters } from "../styled";
import { useMatchBreakpoints } from "hooks";
import { Text } from "components/text";
import { type Option } from "components/selects/types";
import { useUserSettings } from "context/event-store-context";
import { SortMarketsBy } from "@sdk/indexer-v2/types/common";

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

export type FilterOptionsComponentProps = {
  filter: SortMarketsBy;
  onChange: (value: SortMarketsBy) => void;
};

export const FilterOptionsComponent = ({ filter, onChange }: FilterOptionsComponentProps) => {
  const selectedOption = options.find((x) => x.value === filter)!;
  const { t } = translationFunction();
  const { isLaptopL } = useMatchBreakpoints();
  const animate = useUserSettings((s) => s.animate);
  const toggleAnimate = useUserSettings((s) => s.toggleAnimate);

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

      <FlexGap gap="12px" className={"med-pixel-text"}>
        <Text className={"med-pixel-text"} color="lightGray" textTransform="uppercase">
          {t("Animate:")}
        </Text>

        <Switcher checked={animate} onChange={toggleAnimate} scale={isLaptopL ? "md" : "sm"} />
      </FlexGap>
    </StyledTHFilters>
  );
};

export default FilterOptionsComponent;
