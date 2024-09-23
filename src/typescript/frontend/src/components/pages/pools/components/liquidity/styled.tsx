import styled from "styled-components";

export const StyledAddLiquidityWrapper = styled.div`
  display: flex;
  flex-direction: column;
  border: ${({ theme }) => `1px solid ${theme.colors.darkGray}`};
  border-radius: ${({ theme }) => theme.radii.xSmall};
  margin-bottom: 17px;
  .liquidity-input {
    border-bottom: #33343d solid 1px;
    border-bottom-radius: 0;
  }
  .liquidity-input:last-child {
    border-bottom: unset;
    border-bottom-radius: unset;
  }
`;
