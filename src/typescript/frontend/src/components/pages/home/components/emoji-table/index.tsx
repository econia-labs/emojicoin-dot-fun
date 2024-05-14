"use client";

import React, { useState } from "react";

import { useTranslation } from "context/language-context";
import { useMatchBreakpoints } from "hooks";
import { Text } from "components/text";
import { Switcher } from "components/switcher";
import SingleSelect from "components/selects/single-select";
import { Input } from "components/inputs/input";
import { InputGroup } from "components/inputs/input-group";
import { Column, FlexGap } from "@/containers";
import { ButtonsBlock } from "./components";
import TableCard from "../table-card";
import { StyledTHWrapper, StyledTH, StyledTHFilters, StyledWrapper, StyledInner } from "./styled";
import { DropdownMenu } from "components/selects";
import { type Option } from "components/selects/types";

const ITEMS_LIST_MOKS = [
  {
    emoji: "⛓️",
    emojiName: "Chains",
    marketCap: "11.11M",
    volume24h: "11.11M",
  },
  {
    emoji: "🦋",
    emojiName: "Butterfly",
    marketCap: "11.11M",
    volume24h: "11.11M",
  },
  {
    emoji: "🖤🖤",
    emojiName: "BLACK HEARTS",
    marketCap: "11.11M",
    volume24h: "11.11M",
  },
  {
    emoji: "🌻",
    emojiName: "Sunflower",
    marketCap: "11.11M",
    volume24h: "11.11M",
  },
  {
    emoji: "🍄",
    emojiName: "Mushroom",
    marketCap: "11.11M",
    volume24h: "11.11M",
  },
];

const options: Option[] = [
  { title: "Bump Order", value: "Bump Order" },
  { title: "Market Cap", value: "Market Cap" },
  { title: "24h Volume", value: "24h Volume" },
  { title: "Alltime Vol", value: "Alltime Vol" },
];

const EmojiTable: React.FC = () => {
  const [selectedOption, setSelectedOption] = useState<Option | null>(options[1]);
  const [isChecked, setIsChecked] = useState(true);
  const { t } = useTranslation();
  const { isMobile, isLaptopL } = useMatchBreakpoints();

  const list = isLaptopL
    ? [...ITEMS_LIST_MOKS, ...ITEMS_LIST_MOKS, ...ITEMS_LIST_MOKS, ...ITEMS_LIST_MOKS]
    : isMobile
      ? ITEMS_LIST_MOKS
      : [...ITEMS_LIST_MOKS, ...ITEMS_LIST_MOKS].slice(0, 9);

  const handler = () => {
    setIsChecked(!isChecked);
  };

  return (
    <Column>
      <StyledTHWrapper>
        <StyledTH>
          <InputGroup
            label="Search:"
            textScale={{ _: "heading2", laptopL: "heading1" }}
            variant="fantom"
            forId="search"
            isShowError={false}
          >
            <Input id="search" />
          </InputGroup>

          <StyledTHFilters>
            <SingleSelect
              wrapperProps={{ width: isLaptopL ? "300px" : "210px" }}
              title={selectedOption?.title}
              value={selectedOption}
              setValue={setSelectedOption}
              dropdownComponent={DropdownMenu}
              options={options}
              dropdownWrapperProps={{ width: "300px" }}
              titleProps={{ color: "darkGrey", textTransform: "uppercase" }}
              placeholderProps={{ textTransform: "uppercase", color: "lightGrey" }}
              placeholder="Sort:"
            />

            <FlexGap gap="12px">
              <Text
                textScale={{ _: "pixelHeading4", laptopL: "pixelHeading3" }}
                color="lightGrey"
                textTransform="uppercase"
              >
                {t("Anime:")}
              </Text>

              <Switcher checked={isChecked} onChange={handler} scale={isLaptopL ? "md" : "sm"} />
            </FlexGap>
          </StyledTHFilters>
        </StyledTH>
      </StyledTHWrapper>

      <StyledWrapper>
        <StyledInner>
          {list.map(({ emoji, emojiName, marketCap, volume24h }, index) => {
            return (
              <TableCard
                index={index + 1}
                emoji={emoji}
                emojiName={emojiName}
                marketCap={marketCap}
                volume24h={volume24h}
                key={index}
              />
            );
          })}
        </StyledInner>
      </StyledWrapper>

      <ButtonsBlock />
    </Column>
  );
};

export default EmojiTable;
