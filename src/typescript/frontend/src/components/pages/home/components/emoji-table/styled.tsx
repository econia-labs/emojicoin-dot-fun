"use client";

import styled from "styled-components";
import base from "theme/base";
import { darkColors } from "theme/colors";
import { EMOJI_GRID_ITEM_WIDTH, MAX_WIDTH } from "../const";

export const StyledTHFilters = styled.div`
  display: flex;
  align-items: baseline;
  width: 100%;
  justify-content: space-between;
  margin-bottom: 8px;

  ${base.mediaQueries.tablet} {
    width: unset;
    margin-bottom: unset;
  }
`;

export const StyledGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, ${EMOJI_GRID_ITEM_WIDTH}px);
  justify-content: center;
  gap: 0;
  width: 100%;
`;

const PADDING = 40;

export const OutermostContainer = styled.div`
  display: flex;
  padding: 0 ${PADDING}px;
  border-top: 1px solid ${darkColors.darkGray};
`;

export const OuterContainer = styled.div`
  display: flex;
  justify-content: center;
  width: 100%;
`;

export const InnerGridContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  max-width: ${MAX_WIDTH}px;
  justify-items: center;
`;

// There's no modulo in CSS, so we have to provide the breakpoints manually per # of items per grid.
// Max width is 1813px so we stop at 1813px.
let width = EMOJI_GRID_ITEM_WIDTH;
let mediaQueries = "";
while (width < MAX_WIDTH) {
  mediaQueries += `
  @media (min-width: ${width + PADDING * 2}px) {
    padding-left: calc((100vw - ${PADDING * 2 + width}px) / 2);
    padding-right: calc((100vw - ${PADDING * 2 + width}px) / 2);
  }`;
  width += EMOJI_GRID_ITEM_WIDTH;
}

export const Header = styled.div`
  display: flex;
  position: relative;
  width: 100%;
  align-items: center;
  justify-content: center;

  ${mediaQueries}

  @media (min-width: ${MAX_WIDTH + PADDING * 2}px) {
    padding-left: 0px;
    padding-right: 0px;
  }
`;

const WrapperCss = `
  display: flex;
  width: 100%;
  height: 100%;
  align-items: center;

  &:after {
    content: "";
    position: absolute;
    bottom: 0;
    border-bottom: 1px solid ${darkColors.darkGray};
    width: 200vw;
  }
`;

export const SearchWrapper = styled.div`
  ${WrapperCss}
  justify-content: left;
  padding-left: 20px;
  border-left: 1px solid ${darkColors.darkGray};
  margin-left: -1px;

  &:after {
    left: 0;
  }
`;

export const FilterOptionsWrapper = styled.div`
  ${WrapperCss}
  justify-content: right;
  padding-right: 20px;
  border-right: 1px solid ${darkColors.darkGray};
  margin-right: -1px;

  &:after {
    right: 0;
  }
`;
