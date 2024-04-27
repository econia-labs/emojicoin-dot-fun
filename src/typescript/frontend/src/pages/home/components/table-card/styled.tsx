import styled from "styled-components";
import { Svg } from "components";

export const StyledInnerItem = styled.div`
  width: 20%;
  border: 1px solid ${({ theme }) => theme.colors.darkGrey};
  display: flex;
  flex-direction: column;
  padding: 10px 19px;
  position: relative;
  overflow: hidden;
  cursor: pointer;
`;

export const StyledIconWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    ${Svg} {
      g {
        path {
          fill: ${({ theme }) => theme.colors.blue};
        }
      }
    }
  }
`;

export const StyledHiddenContent = styled.div`
  position: absolute;
  background-color: ${({ theme }) => theme.colors.black};
  transition-delay: 0.3s;
  top: 0;
  bottom: 0;
  right: 0;
  left: 0;
  margin: 1px;
  opacity: 0;
  z-index: 5;
  transition: opacity 0.3s ease-in;
  text-transform: none;
  padding: 12px;
  display: flex;
  flex-direction: column;
  &:hover {
    opacity: 1;
  }
`;
