import React from "react";

import { Flex } from "components";
import { SpinnerIcon } from "components/svg";

import { FlexProps } from "components/layout/components/types";

const Loader: React.FC<FlexProps> = props => {
  return (
    <Flex justifyContent="center" alignItems="center" height="100vh" {...props}>
      <SpinnerIcon width="44px" />
    </Flex>
  );
};

export default Loader;
