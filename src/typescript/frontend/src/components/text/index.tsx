import styled, { css } from "styled-components";
import { space, typography, layout, opacity, flexbox } from "styled-system";
import { fontWeights, textStyles } from "./theme";

import { type scales, type TextProps, type ThemedProps } from "./types";

export const getEllipsis = ({ ellipsis }: ThemedProps) => {
  if (ellipsis) {
    return css`
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    `;
  }
};

export const wordBreak = ({ wordBreak }: ThemedProps) => {
  if (wordBreak) {
    return css`
      word-break: ${wordBreak};
    `;
  }
};

export const Text = styled.p.attrs<TextProps>(({ textScale = "display6" }) => ({
  textScale,
}))`
  color: ${({ theme, color }) => (color ? theme.colors[color] : theme.colors.white)};
  text-transform: ${({ textTransform }) => textTransform};

  ${({ textScale }) => textScale && textStyles(textScale as keyof typeof scales)}

  ${fontWeights}
  ${wordBreak}
  ${getEllipsis}
  ${space}
  ${typography}
  ${layout}
  ${opacity}
  ${flexbox}
`;

export default Text;
