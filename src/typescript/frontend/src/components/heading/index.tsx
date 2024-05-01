import styled from "styled-components";
import { Text } from "components";

import { styles } from "./theme";
import { getStylesFromResponsiveValue } from "utils";

import { scales, HeadingProps, Scales } from "./types";

const Heading = styled(Text)<HeadingProps>`
  ${({ scale }) => scale && getStylesFromResponsiveValue<Scales>(scale, styles)}
`;

Heading.defaultProps = {
  as: scales.h1,
  scale: scales.h1,
  $fontWeight: "bold",
};

export default Heading;
