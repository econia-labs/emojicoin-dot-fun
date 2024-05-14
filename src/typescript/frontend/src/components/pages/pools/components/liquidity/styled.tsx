import styled from "styled-components";

export const StyledAddLiquidityWrapper = styled.div`
  display: flex;
  flex-direction: column;
  border: ${({ theme }) => `1px solid ${theme.colors.darkGrey}`};
  border-radius: ${({ theme }) => theme.radii.xSmall};
  margin-bottom: 17px;
`;
