"use client";

import React, { useState } from "react";

import { StyledModalWrapper } from "../styled";
import CloseModalWrapper from "../close-modal-wrapper";
import { MobileMenuItem } from "../../../header/components";
import { Column } from "@/containers";

import { useAppDispatch, useAppSelector } from "store/store";
import { hideModal } from "store/modal";

import { type WalletModalProps } from "./types";

const WalletModal: React.FC = () => {
  const { items } = useAppSelector(state => state.modal.props as unknown as WalletModalProps);
  const [itemsList, setItemsList] = useState(items);

  const dispatch = useAppDispatch();

  const closeModalHandler = () => {
    dispatch(hideModal());
  };

  const onCopyAddressClick = (index: number) => {
    if (index === 0) {
      setItemsList([{ title: "Copied!" }, { title: "Disconnect" }]);
    }
  };

  return (
    <StyledModalWrapper>
      <CloseModalWrapper closeModalHandler={closeModalHandler} />

      <Column p="10px" width="100%">
        {itemsList.map(({ title }, index) => (
          <MobileMenuItem
            title={title}
            key={index}
            onClick={() => onCopyAddressClick(index)}
            borderBottom={items.length - 1 !== index}
          />
        ))}
      </Column>
    </StyledModalWrapper>
  );
};

export default WalletModal;
