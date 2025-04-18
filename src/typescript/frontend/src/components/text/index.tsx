import styled, { css } from "styled-components";
import { flexbox, layout, opacity, space, typography } from "styled-system";

import { fontWeights, textStyles } from "./theme";
import type { scales, TextProps, ThemedProps } from "./types";

const getEllipsis = ({ ellipsis }: ThemedProps) => {
  if (ellipsis) {
    return css`
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    `;
  }
};

const wordBreak = ({ wordBreak }: ThemedProps) => {
  if (wordBreak) {
    return css`
      word-break: ${wordBreak};
    `;
  }
};

const Text = styled.p.attrs<TextProps>(({ textScale = "display6" }) => ({
  textScale,
}))`
  color: ${({ theme, color }) => (color ? theme.colors[color] : undefined)};
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
