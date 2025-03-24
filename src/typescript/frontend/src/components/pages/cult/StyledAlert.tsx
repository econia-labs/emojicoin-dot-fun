import { Alert } from "@react95/core";
import styled from "styled-components";

export const StyledAlert = styled(Alert)`
  font-family: var(--font-pixelar);
  z-index: 2000;
  padding-bottom: 24px;
  & > div:nth-child(2) {
    flex-direction: row;
    white-space: pre-wrap;
    padding: 30px 40px 30px 40px !important;
    @media (max-width: 640px) {
      padding: 10px 10px 10px 10px !important;
    }
    & > div:first-child > svg {
      width: 50px;
      height: 50px;

      @media (max-width: 320px) {
        display: none;
      }
    }
  }
  & > div > button {
    font-size: 27px;
    text-transform: uppercase;
    padding: 7px 30px;
  }
  & > .draggable {
    height: auto;
    font-size: 36px;
    width: 50px;
    height: 50px;
  }

  & > div > button {
    font-size: 27px;
    text-transform: uppercase;
    padding: 7px 30px;
  }
  & > .draggable {
    width: 100%;
    height: auto;
    font-size: 36px;
    display: flex;
    align-items: center;
    & button {
      &::before {
        transform: translate(0px, 1px);
        content: url("images/close.svg");
        scale: 2.5;
      }
      & > img {
        display: none;
      }
      margin-right: 8px;
      height: 32px;
      width: 32px;
    }
  }
`;
