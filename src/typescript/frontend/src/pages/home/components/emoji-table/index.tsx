import React, { useState } from "react";

import { useTranslation } from "context";

import { Column, Text, FlexGap, Switcher, SingleSelect, Input, InputGroup } from "components";
import { ButtonsBlock } from "./components";
import { TableCard } from "../index";
import { StyledTHWrapper, StyledTH, StyledTHFilters, StyledWrapper, StyledInner } from "./styled";
import { DropdownMenu } from "components/selects";
import { Option } from "components/selects/types";

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

  const handler = () => {
    setIsChecked(!isChecked);
  };

  return (
    <Column>
      <StyledTHWrapper>
        <StyledTH>
          <InputGroup label="Search:" variant="fantom" forId="search" isShowError={false}>
            <Input id="search" />
          </InputGroup>

          <StyledTHFilters>
            <SingleSelect
              wrapperProps={{ width: "300px" }}
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
              <Text textScale="pixelHeading3" color="lightGrey" textTransform="uppercase">
                {t("Anime:")}
              </Text>

              <Switcher checked={isChecked} onChange={handler} />
            </FlexGap>
          </StyledTHFilters>
        </StyledTH>
      </StyledTHWrapper>

      <StyledWrapper>
        <StyledInner>
          {[...ITEMS_LIST_MOKS, ...ITEMS_LIST_MOKS, ...ITEMS_LIST_MOKS, ...ITEMS_LIST_MOKS].map(
            ({ emoji, emojiName, marketCap, volume24h }, index) => {
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
            },
          )}
        </StyledInner>
      </StyledWrapper>

      <ButtonsBlock />
    </Column>
  );
};

export default EmojiTable;
