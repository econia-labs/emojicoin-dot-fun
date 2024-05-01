import React from "react";

import { Flex } from "components";
import { CloseIconWithHover } from "components/svg";

import { CloseModalWrapperProps } from "./types";

const CloseModalWrapper: React.FC<CloseModalWrapperProps> = ({ children, closeModalHandler, ...props }) => {
  return (
    <Flex width="100%" justifyContent="flex-end" alignItems="center" {...props}>
      <Flex alignItems="center" width="100%">
        {children}
      </Flex>

      <CloseIconWithHover onClick={closeModalHandler} />
    </Flex>
  );
};

export default CloseModalWrapper;
