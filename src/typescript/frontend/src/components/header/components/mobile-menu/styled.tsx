import styled from "styled-components";
import { motion } from "framer-motion";

export const StyledMotion = styled(motion.div)<{ offsetHeight: number }>`
  position: fixed;
  bottom: 0;
  top: ${({ offsetHeight }) => offsetHeight}px;
  right: 0;
  left: 0;
  z-index: ${({ theme }) => theme.zIndices.modal};
  background-color: ${({ theme }) => theme.colors.econiaBlue};
`;

export const MobileMenuWrapper = styled.div<{ offsetHeight: number }>`
  position: relative;
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  min-height: ${({ offsetHeight }) => `calc(100dvh - ${offsetHeight}px)`};
  justify-content: center;
  align-items: center;
  background-color: ${({ theme }) => theme.colors.econiaBlue};
  padding: 60px 18px;
`;

export const MobileMenuInner = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  transform: translateY(-50%);
`;
