import styled from "styled-components";
import { scaleAnimation } from "theme";

export const StyledContainer = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: center;
  max-width: 1108px;
`;

export const StyledSocialWrapper = styled.div`
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24px 0;
  border-bottom: 1px solid ${({ theme }) => theme.colors.darkGray};

  ${({ theme }) => theme.mediaQueries.tablet} {
    padding: 48px 0;
  }
`;

export const StyledClickItem = styled.div`
  width: fit-content;
  ${scaleAnimation}
`;
