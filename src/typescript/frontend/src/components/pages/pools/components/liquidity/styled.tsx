import styled from "styled-components";

export const StyledAddLiquidityWrapper = styled.div`
  display: flex;
  flex-direction: column;
  border: ${({ theme }) => `1px solid ${theme.colors.darkGray}`};
  border-radius: ${({ theme }) => theme.radii.xSmall};
  margin-bottom: 17px;
  #apt {
    border-bottom: #33343D solid 1px;
    border-bottom-radius: 0;
  }
`;
