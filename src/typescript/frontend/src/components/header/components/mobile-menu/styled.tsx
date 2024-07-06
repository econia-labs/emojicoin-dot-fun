import styled from "styled-components";
import { motion } from "framer-motion";
import { ECONIA_BLUE } from "theme/colors";

export const StyledMotion = styled(motion.div)`
  position: fixed;
  bottom: 0;
  top: 0;
  right: 0;
  left: 0;
  z-index: ${({ theme }) => theme.zIndices.modal};
  background-color: ${ECONIA_BLUE};
`;

export const MobileMenuWrapper = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100dvh;
  justify-content: center;
  align-items: center;
  background-color: ${ECONIA_BLUE};
  padding: 0 18px;
`;

export const MobileMenuInner = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
`;
