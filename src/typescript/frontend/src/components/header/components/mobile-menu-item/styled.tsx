import styled, { css } from "styled-components";

const getBorderBottom = ({ borderBottom }) => {
  if (borderBottom) {
    return css`
      border-bottom: 1px dashed ${({ theme }) => theme.colors.darkGrey};
    `;
  }
};
export const StyledItemWrapper = styled.div<{ borderBottom: boolean }>`
  display: flex;
  justify-content: space-between;
  width: 100%;
  padding-left: 9px;
  padding-right: 9px;
  cursor: pointer;

  ${getBorderBottom}
`;
