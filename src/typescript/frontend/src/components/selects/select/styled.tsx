import styled from "styled-components";

import { Box } from "components";

export const DropdownSelectWrapper = styled(Box)`
  cursor: pointer;
  user-select: none;
  border-radius: ${({ theme }) => theme.radii.small};
  display: flex;
`;
