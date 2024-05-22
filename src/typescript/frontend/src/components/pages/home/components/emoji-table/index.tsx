"use client";

import React, { useState } from "react";

import { useTranslation } from "context/language-context";
import { useMatchBreakpoints, useElementDimensions, useEmojicoinPicker } from "hooks";
import { Text } from "components/text";
import { Switcher } from "components/switcher";
import SingleSelect from "components/selects/single-select";
import { Input } from "components/inputs/input";
import { InputGroup } from "components/inputs/input-group";
import { Column, Flex, FlexGap } from "@/containers";
import { ButtonsBlock } from "./components";
import TableCard from "../table-card";
import { StyledTHWrapper, StyledTH, StyledTHFilters, StyledWrapper, StyledGrid } from "./styled";
import { DropdownMenu } from "components/selects";
import { type Option } from "components/selects/types";
import { isDisallowedEventKey } from "../../../../../utils";

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
  const { isLaptopL } = useMatchBreakpoints();
  const { offsetWidth: styledGridWidth } = useElementDimensions("StyledGrid");

  const list = styledGridWidth => {
    const getData = (
      data: { emoji: string; emojiName: string; marketCap: string; volume24h: string }[],
      dataLength: number,
    ) =>
      Array(dataLength)
        .fill({})
        .map((_, index) => (data[index] ? data[index] : { emoji: "", emojiName: "", marketCap: "", volume24h: "" }));

    switch (styledGridWidth) {
      case 259: {
        const data = ITEMS_LIST_MOKS;
        return getData(data, 5);
      }
      case 518: {
        const data = [...ITEMS_LIST_MOKS, ...ITEMS_LIST_MOKS];
        return getData(data, 10);
      }
      case 777: {
        const data = [...ITEMS_LIST_MOKS, ...ITEMS_LIST_MOKS];
        return getData(data, 9);
      }
      case 1036: {
        const data = [...ITEMS_LIST_MOKS, ...ITEMS_LIST_MOKS, ...ITEMS_LIST_MOKS];
        return getData(data, 12);
      }
      case 1295: {
        const data = [...ITEMS_LIST_MOKS, ...ITEMS_LIST_MOKS, ...ITEMS_LIST_MOKS, ...ITEMS_LIST_MOKS];
        return getData(data, 20);
      }
      case 1554: {
        const data = [
          ...ITEMS_LIST_MOKS,
          ...ITEMS_LIST_MOKS,
          ...ITEMS_LIST_MOKS,
          ...ITEMS_LIST_MOKS,
          ...ITEMS_LIST_MOKS,
        ];
        return getData(data, 24);
      }

      case 1813: {
        const data = [
          ...ITEMS_LIST_MOKS,
          ...ITEMS_LIST_MOKS,
          ...ITEMS_LIST_MOKS,
          ...ITEMS_LIST_MOKS,
          ...ITEMS_LIST_MOKS,
        ];
        return getData(data, 28);
      }
    }
    return ITEMS_LIST_MOKS;
  };

  const { targetRef, tooltip } = useEmojicoinPicker({
    onEmojiClick: () => {},
    placement: "bottom",
    width: 288,
  });

  const handler = () => {
    setIsChecked(!isChecked);
  };

  const onInputChange = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (isDisallowedEventKey(e)) {
      e.preventDefault();
    }
  };

  return (
    <Column>
      <StyledTHWrapper>
        <StyledTH maxWidth={styledGridWidth + 2}>
          <InputGroup
            label="Search:"
            textScale={{ _: "pixelHeading4", laptopL: "pixelHeading3" }}
            variant="fantom"
            forId="search"
            isShowError={false}
          >
            <Input id="search" autoComplete="off" onKeyDown={onInputChange} ref={targetRef} />
          </InputGroup>
          {tooltip}

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
        <Flex width="100%" maxWidth="1813px" justifyContent="center">
          <StyledGrid id="StyledGrid">
            {list(styledGridWidth).map(({ emoji, emojiName, marketCap, volume24h }, index) => {
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
          </StyledGrid>
        </Flex>
      </StyledWrapper>

      <ButtonsBlock />
    </Column>
  );
};

export default EmojiTable;
