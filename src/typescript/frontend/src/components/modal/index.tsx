import React, { useEffect } from "react";
import { AnimatePresence, usePresence } from "framer-motion";

import { hideModal } from "store/modal";
import { useAppDispatch, useAppSelector } from "store/store";
import { ModalWrapper } from "./components";
import { components } from "./constants";

import { useHideOverflow } from "./hooks";

const Modal: React.FC = () => {
  const modalName = useAppSelector(state => state.modal.modalName);
  const rootId = useAppSelector(state => state.modal.rootId);
  const clickOutsideHandler = useAppSelector(state => state.modal.clickOutsideHandler);

  const [isPresent, safeToRemove] = usePresence();

  useEffect(() => {
    !isPresent && setTimeout(safeToRemove, 1000);
  }, [isPresent]);

  const dispatch = useAppDispatch();
  const ModalComponent = modalName ? components[modalName] : null;

  useHideOverflow({ trigger: !!modalName });

  const onOutsideClick = () => {
    if (clickOutsideHandler) {
      clickOutsideHandler();
    } else {
      dispatch(hideModal());
    }
  };

  if (!ModalComponent) {
    return null;
  }

  return (
    <AnimatePresence>
      {ModalComponent && (
        <ModalWrapper onOutsideClick={onOutsideClick} id={rootId}>
          <ModalComponent />
        </ModalWrapper>
      )}
    </AnimatePresence>
  );
};

export default Modal;
