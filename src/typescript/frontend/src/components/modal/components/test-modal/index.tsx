"use client";

import React from "react";

import Heading from "components/heading";
import { Text } from "components/text";
import { StyledModalWrapper } from "../styled";
import CloseModalWrapper from "../close-modal-wrapper";

import { useAppDispatch, useAppSelector } from "store/store";
import { hideModal } from "store/modal";

import { type TestModalProps } from "./types";

const TestModal: React.FC = () => {
  const { title } = useAppSelector(state => state.modal.props as unknown as TestModalProps);

  const dispatch = useAppDispatch();

  const closeModalHandler = () => {
    dispatch(hideModal());
  };

  return (
    <StyledModalWrapper>
      <CloseModalWrapper closeModalHandler={closeModalHandler} />

      <Heading textAlign="center" scale="h4" as="h4">
        Header with custom prop {title}
      </Heading>
      <Text textScale="display2">This is a test modal</Text>
    </StyledModalWrapper>
  );
};

export default TestModal;
