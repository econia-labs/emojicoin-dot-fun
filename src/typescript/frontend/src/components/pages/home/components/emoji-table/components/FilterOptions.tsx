import { FlexGap } from "@containers";
import { SingleSelect, DropdownMenu } from "components/selects";
import { Switcher } from "components/switcher";
import { translationFunction } from "context/language-context";
import { StyledTHFilters } from "../styled";
import { useMatchBreakpoints } from "hooks";
import { Text } from "components/text";
import { type Option } from "components/selects/types";
import { MarketDataSortBy } from "lib/queries/sorting/types";
import { useUserSettings } from "context/state-store-context";

const titleFromValue: Record<MarketDataSortBy, string> = {
  [MarketDataSortBy.MarketCap]: "Market Cap",
  [MarketDataSortBy.BumpOrder]: "Bump Order",
  [MarketDataSortBy.DailyVolume]: "24h Volume",
  [MarketDataSortBy.AllTimeVolume]: "Alltime Vol",
  [MarketDataSortBy.Price]: "Price",
  [MarketDataSortBy.Apr]: "APR",
  [MarketDataSortBy.Tvl]: "TVL",
};

const options: Array<Option> = [
  { title: titleFromValue[MarketDataSortBy.MarketCap], value: MarketDataSortBy.MarketCap },
  { title: titleFromValue[MarketDataSortBy.BumpOrder], value: MarketDataSortBy.BumpOrder },
  { title: titleFromValue[MarketDataSortBy.DailyVolume], value: MarketDataSortBy.DailyVolume },
  { title: titleFromValue[MarketDataSortBy.AllTimeVolume], value: MarketDataSortBy.AllTimeVolume },
  // TODO: Add price..?
];

export type FilterOptionsComponentProps = {
  filter: MarketDataSortBy;
  onChange: (value: MarketDataSortBy) => void;
};

export const FilterOptionsComponent = ({ filter, onChange }: FilterOptionsComponentProps) => {
  const selectedOption = options.find((x) => x.value === filter)!;
  const { t } = translationFunction();
  const { isLaptopL } = useMatchBreakpoints();
  const animate = useUserSettings((s) => s.animate);
  const toggleAnimate = useUserSettings((s) => s.toggleAnimate);

  const handler = () => {
    toggleAnimate();
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
          onChange(option.value as MarketDataSortBy);
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

        <Switcher checked={animate} onChange={handler} scale={isLaptopL ? "md" : "sm"} />
      </FlexGap>
    </StyledTHFilters>
  );
};

export default FilterOptionsComponent;
