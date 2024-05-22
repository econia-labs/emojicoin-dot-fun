import styled from "styled-components";

export const StyledModalWrapper = styled.div`
  display: flex;
  width: 286px;
  padding: 12px;

  ${({ theme }) => theme.mediaQueries.tablet} {
    width: 418px;
  }

  flex-direction: column;
  justify-content: center;
  align-items: center;
  border-radius: ${({ theme }) => theme.radii.xSmall};
`;
