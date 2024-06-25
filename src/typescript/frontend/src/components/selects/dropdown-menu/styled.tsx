import styled from "styled-components";

import { Box } from "@containers";

export const DropdownMenuWrapper = styled(Box)`
  max-height: 300px;
  border-radius: 3px;
  overflow: auto;
  background-color: ${({ theme }) => theme.colors.econiaBlue};
`;
