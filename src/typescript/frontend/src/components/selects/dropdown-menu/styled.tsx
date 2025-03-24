import { Box } from "@containers";
import styled from "styled-components";

export const DropdownMenuWrapper = styled(Box)`
  max-height: 300px;
  border-radius: 3px;
  overflow: auto;
  background-color: ${({ theme }) => theme.colors.econiaBlue};
`;
