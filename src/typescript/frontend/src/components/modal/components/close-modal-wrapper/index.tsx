"use client";

import React from "react";

import { Flex } from "@/containers";
import { CloseIconWithHover } from "components/svg/components/close-icon-with-hover";
import { type CloseModalWrapperProps } from "./types";

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
