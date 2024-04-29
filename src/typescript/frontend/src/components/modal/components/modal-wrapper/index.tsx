import React from "react";
import { createPortal } from "react-dom";

import { StyledModalWrapper, StyledModalContainer } from "./styled";
import { ModalWrapperProps } from "./types";
import { appearanceAnimationMap, appearanceAnimationVariants } from "theme";

const ModalWrapper: React.FC<ModalWrapperProps> = ({ children, id, onOutsideClick }) => {
  const modalRoot = document.getElementById(id);

  const onParentContainerClick = (event: React.MouseEvent<HTMLDivElement>) => {
    return event.stopPropagation();
  };

  if (modalRoot) {
    return createPortal(
      <StyledModalWrapper
        key="modal"
        {...appearanceAnimationMap}
        variants={appearanceAnimationVariants}
        transition={{ duration: 0.3 }}
        onClick={onOutsideClick}
      >
        <StyledModalContainer onClick={onParentContainerClick}>{children}</StyledModalContainer>
      </StyledModalWrapper>,

      modalRoot,
    );
  }
  return null;
};

export default ModalWrapper;
