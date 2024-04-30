import styled, { css } from "styled-components";

export const DropdownMenuInner = styled.div`
  display: flex;
  width: 100%;
  justify-content: space-between;
  padding: 12px;
`;

export const StyledDropdownMenuItem = styled.div<{ disabled: boolean }>`
  padding: 0 18px;
  display: flex;

  &:not(:last-child) {
    ${DropdownMenuInner} {
      border-bottom: 2px dashed ${({ theme }) => theme.colors.black};
    }
  }

  &:hover {
  }

  ${({ disabled }) =>
    disabled &&
    css`
      cursor: not-allowed;
      background-color: ${({ theme }) => theme.colors.blue};
    `}
`;
