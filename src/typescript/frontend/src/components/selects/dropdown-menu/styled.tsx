import styled, { css } from "styled-components";

import { Box } from "components";

export const DropdownMenuInner = styled.div`
  display: flex;
  width: 100%;
  justify-content: space-between;
  padding: 12px;
`;

export const DropdownMenuItem = styled.div<{ disabled: boolean }>`
  padding: 0 18px;
  display: flex;

  &:not(:last-child) {
    ${DropdownMenuInner} {
      border-bottom: 2px dashed ${({ theme }) => theme.colors.black};
    }
  }

  &:hover {
    background-color: ${({ theme }) => theme.colors.blue};
  }

  ${({ disabled }) =>
    disabled &&
    css`
      cursor: not-allowed;
      background-color: ${({ theme }) => theme.colors.blue};
    `}
`;

export const DropdownMenuWrapper = styled(Box)`
  max-height: 300px;
  border-radius: inherit;
  overflow: auto;
  background-color: ${({ theme }) => theme.colors.econiaBlue};
`;
