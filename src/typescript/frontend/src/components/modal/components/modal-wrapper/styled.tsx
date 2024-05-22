import { motion } from "framer-motion";
import styled from "styled-components";

export const StyledModalWrapper = styled(motion.div)`
  background-color: ${({ theme }) => theme.colors.black + "66"};
  backdrop-filter: blur(5px);
  position: fixed;
  top: 0;
  left: 0;
  bottom: 0;
  right: 0;
  display: grid;
  overflow: auto;
  justify-content: center;
  align-items: center;
  z-index: ${({ theme }) => theme.zIndices.modal};
  cursor: pointer;
`;

export const StyledModalContainer = styled(motion.div)`
  margin: 24px 16px;
  ${({ theme }) => theme.mediaQueries.tablet} {
    margin: 24px 32px;
  }
  background-color: ${({ theme }) => theme.colors.econiaBlue};
  border-radius: ${({ theme }) => theme.radii.xSmall};
  cursor: initial;
`;
