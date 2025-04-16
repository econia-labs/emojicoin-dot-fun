import { motion } from "framer-motion";
import styled from "styled-components";

export const StyledMotion = styled(motion.div)`
  position: fixed;
  bottom: 0;
  top: 0;
  right: 0;
  left: 0;
  z-index: ${({ theme }) => theme.zIndices.modal};
  background-image: linear-gradient(
    to bottom,
    ${({ theme }) => theme.colors.black} 60%,
    rgb(14, 14, 14) 100%
  );
`;

export const MobileMenuWrapper = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100dvh;
  justify-content: center;
  align-items: center;
  padding: 0 18px;
`;
