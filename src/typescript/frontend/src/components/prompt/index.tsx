import React, { useState } from "react";

import { useTranslation } from "context";

import { CloseIcon } from "components/svg";
import { Flex, Text } from "components";
import { Arrow, StyledPrompt } from "./styled";

import { PromptProps } from "./types";

const Prompt: React.FC<PromptProps> = ({ text }) => {
  const { t } = useTranslation();
  const [isPromptVisible, setIsPromptVisible] = useState(true);

  return (
    <StyledPrompt isVisible={isPromptVisible}>
      <Text textScale="pixelHeading4" color="black" textTransform="uppercase">
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
