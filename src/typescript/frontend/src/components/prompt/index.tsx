"use client";

import React, { useState } from "react";

import { useTranslation } from "context/language-context";

import CloseIcon from "components/svg/icons/Close";
import { Flex } from "@/containers";
import { Text } from "components/text";
import { Arrow, StyledPrompt } from "./styled";

import { type PromptProps } from "./types";

const Prompt: React.FC<PromptProps> = ({ text }) => {
  const { t } = useTranslation();
  const [isPromptVisible, setIsPromptVisible] = useState(true);

  return (
    <StyledPrompt isVisible={isPromptVisible}>
      <Text textScale="pixelHeading4" lineHeight="20px" color="black" textTransform="uppercase">
        {t(text)}
      </Text>

      <Flex height="100%" alignItems="start">
        <CloseIcon
          width="11px"
          cursor="pointer"
          mt="4px"
          color="black"
          onClick={() => {
            setIsPromptVisible(false);
          }}
        />
      </Flex>
      <Arrow />
    </StyledPrompt>
  );
};
export default Prompt;
