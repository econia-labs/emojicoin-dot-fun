import { textStyles } from "components/text/theme";
import styled from "styled-components";
import { mediaQueries } from "theme/base";
import Text, { getEllipsis } from "components/text";

export const StyledHeaderText = styled(Text)`
  ${textStyles("display4")}

  ${mediaQueries.tablet} {
    ${textStyles("display2")}
  }

  ${getEllipsis}
`;

export const StyledStatsText = styled(Text)`
  text-transform: uppercase;

  ${textStyles("display6")}

  ${mediaQueries.tablet} {
    ${textStyles("display4")}
  }

  ${getEllipsis}
`;

export const StyledHeaderEmoji = styled(StyledHeaderText)`
  font-size: 24px;

  ${mediaQueries.tablet} {
    font-size: 64px;
    line-height: 64px;
  }
`;
