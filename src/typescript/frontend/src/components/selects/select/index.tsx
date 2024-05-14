import React from "react";

import { useScramble } from "use-scramble";

import { DropdownSelectWrapper } from "./styled";
import { FlexGap } from "@/containers";
import { Text } from "components/text";

import { useTranslation } from "context";

import { type SelectProps } from "../types";

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
        <Text textScale={{ _: "pixelHeading4", laptopL: "pixelHeading3" }} color="darkGrey">
          {"{"}
        </Text>
        <Text textScale={{ _: "pixelHeading4", laptopL: "pixelHeading3" }} {...placeholderProps} ellipsis>
          {t(placeholder)}
        </Text>

        {!title ? null : typeof title === "string" ? (
          <Text textScale={{ _: "pixelHeading4", laptopL: "pixelHeading3" }} {...titleProps} ellipsis ref={ref}></Text>
        ) : (
          React.isValidElement(title) && title
        )}
        <Text textScale={{ _: "pixelHeading4", laptopL: "pixelHeading3" }} color="darkGrey">
          {"}"}
        </Text>
      </FlexGap>

      {tooltip}
    </DropdownSelectWrapper>
  );
};
