import styled from "styled-components";
import { Text } from "components/text";

import { styles } from "./theme";
import { getStylesFromResponsiveValue } from "utils";

import { scales, type HeadingProps, type Scales } from "./types";

const Heading = styled(Text).attrs<HeadingProps>(({ as = scales.h1, scale = scales.h1, $fontWeight = "bold" }) => ({
  as,
  scale,
  $fontWeight,
}))<HeadingProps>`
  ${({ scale }) => scale && getStylesFromResponsiveValue<Scales>(scale, styles)}
`;

export default Heading;
