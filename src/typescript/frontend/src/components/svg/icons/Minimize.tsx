import React from "react";
import { Text } from "components/text";
import { type TextProps } from "components/text/types";

const Minimize: React.FC<TextProps> = (props) => {
  return (
    <Text textScale="pixelHeading3" {...props}>
      _
    </Text>
  );
};

export default Minimize;
