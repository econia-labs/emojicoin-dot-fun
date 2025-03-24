import { Box } from "@containers";
import styled from "styled-components";

export const DropdownSelectWrapper = styled(Box)`
  cursor: pointer;
  user-select: none;
  border-radius: ${({ theme }) => theme.radii.small};
  display: flex;
`;
