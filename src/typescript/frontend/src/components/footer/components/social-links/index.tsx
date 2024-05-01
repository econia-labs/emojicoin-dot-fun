import React from "react";

import { FlexGap } from "components";
import { StyledIcon } from "./styled";

import { SOCIAL_ICONS } from "components/footer/constants";

import { FlexGapProps } from "components/layout/components/types";

export const SocialLinks: React.FC<FlexGapProps> = props => {
  return (
    <FlexGap gap="14px" justifyContent="flex-end" {...props}>
      {SOCIAL_ICONS.map(({ icon: Icon, href }, index) => (
        <StyledIcon key={index} as="a" target="_blank" href={href}>
          <Icon width="27px" height="27px" />
        </StyledIcon>
      ))}
    </FlexGap>
  );
};
