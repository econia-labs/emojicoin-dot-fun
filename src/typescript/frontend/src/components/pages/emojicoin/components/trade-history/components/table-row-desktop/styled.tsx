import { ExplorerLink } from "components/link/component";
import styled from "styled-components";
import { darkColors } from "theme/colors";

export const ExplorerLinkCustom = styled(ExplorerLink)`
  &:hover > * {
    color: ${darkColors.blue};
    text-decoration: underline;
  }
`;
