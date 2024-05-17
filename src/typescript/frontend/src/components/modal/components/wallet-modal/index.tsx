"use client";

import React from "react";

import { StyledModalWrapper } from "../styled";
import CloseModalWrapper from "../close-modal-wrapper";
import { MobileMenuItem } from "../../../header/components";
import { Column } from "@/containers";

import { useAppDispatch, useAppSelector } from "store/store";
import { hideModal } from "store/modal";

import { type WalletModalProps } from "./types";

const WalletModal: React.FC = () => {
  const { items } = useAppSelector(state => state.modal.props as unknown as WalletModalProps);

  const dispatch = useAppDispatch();

  const closeModalHandler = () => {
    dispatch(hideModal());
  };

  return (
    <StyledModalWrapper>
      <CloseModalWrapper closeModalHandler={closeModalHandler} />

      <Column p="10px" width="100%">
        {items.map(({ title }, index) => (
          <MobileMenuItem title={title} key={index} borderBottom={items.length - 1 !== index} />
        ))}
      </Column>
    </StyledModalWrapper>
  );
};

export default WalletModal;
