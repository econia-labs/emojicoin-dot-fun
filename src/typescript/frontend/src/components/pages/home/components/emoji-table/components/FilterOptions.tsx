"use client";

import { FlexGap } from "@/containers";
import { SingleSelect, DropdownMenu } from "components/selects";
import { Switcher } from "components/switcher";
import { translationFunction } from "context/language-context";
import { StyledTHFilters } from "../styled";
import { useMatchBreakpoints } from "hooks";
import { useState } from "react";
import { Text } from "components/text";
import { type Option } from "components/selects/types";

const options: Option[] = [
  { title: "Market Cap", value: "Market Cap" },
  { title: "Bump Order", value: "Bump Order" },
  { title: "24h Volume", value: "24h Volume" },
  { title: "Alltime Vol", value: "Alltime Vol" },
];

export const FilterOptionsComponent = () => {
  const [selectedOption, setSelectedOption] = useState<Option | null>(options[0]);
  const [isChecked, setIsChecked] = useState(true);
  const { t } = translationFunction();
  const { isLaptopL } = useMatchBreakpoints();

  const handler = () => {
    setIsChecked(v => !v);
  };

  return (
    <StyledTHFilters>
      <SingleSelect
        wrapperProps={{ width: isLaptopL ? "300px" : "210px", className: "med-pixel-text" }}
        title={selectedOption?.title}
        value={selectedOption}
        setValue={setSelectedOption}
        dropdownComponent={DropdownMenu}
        options={options}
        dropdownWrapperProps={{ width: "250px" }}
        titleProps={{ color: "darkGrey", textTransform: "uppercase" }}
        placeholderProps={{ textTransform: "uppercase", color: "lightGrey", className: "med-pixel-text" }}
        placeholder="Sort:"
      />

      <FlexGap gap="12px" className={"med-pixel-text"}>
        <Text className={"med-pixel-text"} color="lightGrey" textTransform="uppercase">
          {t("Anime:")}
        </Text>

        <Switcher checked={isChecked} onChange={handler} scale={isLaptopL ? "md" : "sm"} />
      </FlexGap>
    </StyledTHFilters>
  );
};

export default FilterOptionsComponent;
