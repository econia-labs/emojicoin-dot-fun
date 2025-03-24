import { Text } from "components/text";
import styled from "styled-components";
import { getStylesFromResponsiveValue } from "utils";

import { styles } from "./theme";
import { type HeadingProps, type Scales, scales } from "./types";

const Heading = styled(Text).attrs<HeadingProps>(
  ({ as = scales.h1, scale = scales.h1, $fontWeight = "bold" }) => ({
    as,
    scale,
    $fontWeight,
  })
)<HeadingProps>`
  ${({ scale }) => scale && getStylesFromResponsiveValue<Scales>(scale, styles)}
`;

export default Heading;
