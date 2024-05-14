import styled from "styled-components";
import { Text } from "components/text";

export const StyledEmoji = styled(Text)`
  position: absolute;
  left: 61%;
  transform: translateX(-50%);

  ${({ theme }) => theme.mediaQueries.tablet} {
    transform: translateX(calc(-50% - 23px));
  }
`;
