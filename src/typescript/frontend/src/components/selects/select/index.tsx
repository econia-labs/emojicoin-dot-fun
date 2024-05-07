import React from "react";

import { useScramble } from "use-scramble";

import { DropdownSelectWrapper } from "./styled";
import { Text, FlexGap } from "components";

import { useTranslation } from "context";

import { SelectProps } from "../types";

export const Select: React.FC<SelectProps> = ({
  targetRef,
  wrapperProps,
  title,
  titleProps,
  placeholder = "Please select...",
  placeholderProps,
  tooltip,
}) => {
  const { t } = useTranslation();

  const { ref, replay } = useScramble({
    text: `${title}`,
    overdrive: false,
    speed: 0.5,
  });

  return (
    <DropdownSelectWrapper ref={targetRef} onMouseEnter={replay} {...wrapperProps}>
      <FlexGap gap="8px" ellipsis>
        <Text textScale="pixelHeading3" color="darkGrey">
          {"{"}
        </Text>
        <Text textScale="pixelHeading3" {...placeholderProps} ellipsis>
          {t(placeholder)}
        </Text>

        {!title ? null : typeof title === "string" ? (
          <Text textScale="pixelHeading3" {...titleProps} ellipsis ref={ref}></Text>
        ) : (
          React.isValidElement(title) && title
        )}
        <Text textScale="pixelHeading3" color="darkGrey">
          {"}"}
        </Text>
      </FlexGap>

      {tooltip}
    </DropdownSelectWrapper>
  );
};
