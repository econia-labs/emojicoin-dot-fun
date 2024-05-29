"use client";

import { motion } from "framer-motion";
import styled from "styled-components";
import { scaleAnimation } from "theme";

export const StyledContainer = styled.div`
  background: linear-gradient(0deg, rgba(0, 0, 0, 0) 0%, rgba(0, 0, 0, 0.99) 10%, rgba(0, 0, 0, 1) 100%);
  position: fixed;
  top: 0;
  left: 0;
  z-index: ${({ theme }) => theme.zIndices.header};
  width: 100vw;
`;

export const StyledClickItem = styled.div`
  width: fit-content;
  ${scaleAnimation}
`;

export const StyledMobileHeader = styled(motion.div)`
  display: flex;
  position: fixed;
  bottom: 0;
  top: 0;
  right: 0;
  left: 0;
  z-index: ${({ theme }) => theme.zIndices.modal};
  background-color: ${({ theme }) => theme.colors.econiaBlue};
  padding: 24px;
  align-items: center;
  justify-content: space-between;
`;

export const StyledCloseIcon = styled.div`
  display: flex;
  cursor: pointer;
  transition: all 0.3s ease-out;

  &:hover {
    transform: rotate(180deg);
  }
`;
