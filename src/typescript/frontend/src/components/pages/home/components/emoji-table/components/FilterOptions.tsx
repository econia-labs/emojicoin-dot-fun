"use client";

import { FlexGap } from "@containers";
import { SingleSelect, DropdownMenu } from "components/selects";
import { Switcher } from "components/switcher";
import { translationFunction } from "context/language-context";
import { StyledTHFilters } from "../styled";
import { useMatchBreakpoints } from "hooks";
import { useCallback, useState } from "react";
import { Text } from "components/text";
import { type Option } from "components/selects/types";
import { MarketDataSortBy, toPageQueryParam } from "lib/queries/sorting/types";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { type AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { getSortQueryPath } from "lib/queries/sorting/query-params";

const titleFromValue: Record<MarketDataSortBy, string> = {
  [MarketDataSortBy.MarketCap]: "Market Cap",
  [MarketDataSortBy.BumpOrder]: "Bump Order",
  [MarketDataSortBy.DailyVolume]: "24h Volume",
  [MarketDataSortBy.AllTimeVolume]: "Alltime Vol",
  [MarketDataSortBy.Price]: "Price",
  [MarketDataSortBy.Apr]: "APR",
  [MarketDataSortBy.Tvl]: "TVL",
};

type MyOption = {
  title: string;
  value: MarketDataSortBy;
};

const options: Array<MyOption> = [
  { title: titleFromValue[MarketDataSortBy.MarketCap], value: MarketDataSortBy.MarketCap },
  { title: titleFromValue[MarketDataSortBy.BumpOrder], value: MarketDataSortBy.BumpOrder },
  { title: titleFromValue[MarketDataSortBy.DailyVolume], value: MarketDataSortBy.DailyVolume },
  { title: titleFromValue[MarketDataSortBy.AllTimeVolume], value: MarketDataSortBy.AllTimeVolume },
  // TODO: Add price..?
];

const queryParamToOption = (value: string): MyOption => {
  let option = options.find((o) => toPageQueryParam(o.value) === (value as MarketDataSortBy));
  if (!option) {
    option = options.find((o) => toPageQueryParam(o.value) === MarketDataSortBy.MarketCap)!;
  }
  return option;
};

export const FilterOptionsComponent = () => {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialOption = queryParamToOption(searchParams.get("sort") ?? "");
  const [selectedOption, setSelectedOption] = useState<MyOption>(initialOption);
  const [isChecked, setIsChecked] = useState(true);
  const { t } = translationFunction();
  const { isLaptopL } = useMatchBreakpoints();

  const handler = () => {
    setIsChecked((v) => !v);
  };

  const handleQueryParams = useCallback(
    (option: Option | MyOption, routerFunction: keyof AppRouterInstance) => {
      const newPath = getSortQueryPath({
        value: toPageQueryParam((option as MyOption).value),
        searchParams,
        pathname,
      });
      if (routerFunction === "push") {
        setSelectedOption(option as MyOption);
        // TODO: Consider refactoring the dropdown Single/MultiSelect stuff entirely into a `next/Link` component.
        // It's possible this is actually the only way to do this because I don't think `next/Link` automatically
        // refreshes, but we can look into it.
        router.push(newPath, { scroll: false });
        router.refresh();
      } else if (routerFunction === "prefetch") {
        router.prefetch(newPath);
      }
    },
    [searchParams, pathname, router]
  );

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
        setValue={(option: MyOption | Option) => handleQueryParams(option, "push")}
        dropdownComponent={DropdownMenu}
        onHover={(option: MyOption | Option) => {
          if (option) {
            handleQueryParams(option, "prefetch");
          }
        }}
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

        <Switcher checked={isChecked} onChange={handler} scale={isLaptopL ? "md" : "sm"} />
      </FlexGap>
    </StyledTHFilters>
  );
};

export default FilterOptionsComponent;
