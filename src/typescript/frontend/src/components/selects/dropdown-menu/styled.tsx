import styled from "styled-components";

import { Box } from "components";

export const DropdownMenuWrapper = styled(Box)`
  max-height: 300px;
  border-radius: inherit;
  overflow: auto;
  background-color: ${({ theme }) => theme.colors.econiaBlue};
`;
