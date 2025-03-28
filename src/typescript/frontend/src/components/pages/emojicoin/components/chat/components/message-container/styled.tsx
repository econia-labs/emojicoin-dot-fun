import { motion } from "framer-motion";
import styled from "styled-components";

export const Arrow = styled.div`
  width: 10px;
  height: 10px;
  position: absolute;
  top: 50%;
  transform: translateY(-40%) rotate(45deg);
  background: white !important;
  z-index: -1;
`;

export const StyledMessageInner = styled.div`
  display: flex;
  position: relative;
  padding: 6px;
  border-radius: ${({ theme }) => theme.radii.xSmall};
  margin: 0 7px 11px 7px;
  border: 2px solid white;
  box-shadow: inset 0px 0px 8px 4px rgba(0, 0, 0, 0.6);
`;

export const StyledMessageWrapper = styled(motion.div)<{ alignLeft: boolean }>`
  display: flex;
  flex-direction: column;
  margin-bottom: 11px;
  max-width: 160px;
  height: fit-content;

  ${({ theme }) => theme.mediaQueries.tablet} {
    max-width: 317px;
  }

  align-items: ${({ alignLeft }) => (alignLeft ? "start" : "end")};
`;

export const StyledUserNameWrapper = styled.div`
  display: flex;
`;

export const StyledMessageContainer = styled(motion.div)<{
  alignLeft: boolean;
  backgroundColor?: string;
}>`
  display: flex;
  width: 100%;
  justify-content: ${({ alignLeft }) => (alignLeft ? "start" : "end")};

  ${Arrow} {
    background: ${({ theme, alignLeft }) =>
      alignLeft ? theme.colors.econiaBlue : theme.colors.blue};
    left: ${({ alignLeft }) => (alignLeft ? "-4px" : undefined)};
    right: ${({ alignLeft }) => (alignLeft ? undefined : "-5px")};
  }

  ${StyledUserNameWrapper} {
    justify-content: ${({ alignLeft }) => (alignLeft ? "start" : "end")};
  }

  ${StyledMessageInner} {
    width: fit-content;
    background: ${({ theme, alignLeft, backgroundColor }) =>
      backgroundColor ? backgroundColor : alignLeft ? theme.colors.econiaBlue : theme.colors.blue};
  }
`;
