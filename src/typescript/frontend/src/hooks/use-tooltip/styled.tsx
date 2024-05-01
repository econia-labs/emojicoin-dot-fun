import styled from "styled-components";
import { motion } from "framer-motion";

const PADDING = 16;

export const Arrow = styled.div`
  width: 10px;
  height: 10px;
  background: ${({ theme }) => theme.colors.blue};
`;

export const StyledTooltip = styled(motion.div)`
  padding: ${PADDING}px;
  border-radius: ${({ theme }) => theme.radii.semiMedium};
  max-width: calc(320px - (${PADDING}px * 2));
  z-index: ${({ theme }) => theme.zIndices.tooltip};
  background: ${({ theme }) => theme.colors.blue};
  border: 1px solid ${({ theme }) => theme.colors.blue};
  color: ${({ theme }) => theme.colors.black};
  font-size: 14px;
  word-wrap: break-word;
  box-shadow: ${({ theme }) => theme.shadows.tooltip};

  &[data-popper-placement^="top"] > ${Arrow} {
    bottom: -5px;
    border-bottom: 1px solid ${({ theme }) => theme.colors.blue};
    border-right: 1px solid ${({ theme }) => theme.colors.blue};
  }

  &[data-popper-placement^="bottom"] > ${Arrow} {
    top: -5px;
    border-top: 1px solid ${({ theme }) => theme.colors.blue};
    border-left: 1px solid ${({ theme }) => theme.colors.blue};
  }

  &[data-popper-placement^="left"] > ${Arrow} {
    right: -5px;
    border-top: 1px solid ${({ theme }) => theme.colors.blue};
    border-right: 1px solid ${({ theme }) => theme.colors.blue};
  }

  &[data-popper-placement^="right"] > ${Arrow} {
    left: -5px;
    border-bottom: 1px solid ${({ theme }) => theme.colors.blue};
    border-left: 1px solid ${({ theme }) => theme.colors.blue};
  }
`;
