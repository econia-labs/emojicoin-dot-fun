"use client";

import styled from "styled-components";
import base, { breakpointsArray, mediaQueries } from "theme/base";
import { darkColors } from "theme/colors";
import { EMOJI_GRID_ITEM_WIDTH, MAX_WIDTH, PADDING } from "../const";
import { Flex } from "@containers";

export const StyledTHFilters = styled.div`
  display: flex;
  align-items: center;
  width: 100%;
  justify-content: space-between;

  ${base.mediaQueries.tablet} {
    width: unset;
  }
  @media screen and (max-width: ${breakpointsArray[3]}) {
    justify-content: space-between;
    padding: 10px;
  }
`;

export const StyledSearch = styled(Flex)`
  width: ${EMOJI_GRID_ITEM_WIDTH - 20}px;
  margin: 0;
  padding: 0;
  align-items: center;

  @media screen and (max-width: ${breakpointsArray[3]}) {
    width: 100%;
  }
`;

export const StyledGrid = styled.div`
  display: grid;
  position: relative;
  grid-template-columns: repeat(auto-fill, ${EMOJI_GRID_ITEM_WIDTH}px);
  justify-content: center;
  gap: 0;
  width: 100%;
`;

export const GridRowBorders = styled(StyledGrid)`
  position: absolute;
`;

export const GRID_PADDING = 40;

export const OutermostContainer = styled.div`
  display: flex;
  padding: 0 ${GRID_PADDING}px;
  border-top: 1px solid ${darkColors.darkGray};

  @media screen and (max-width: ${breakpointsArray[3]}) {
    padding: 0;
  }
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
// We already have these in the `module.css` file but I leave it here to show how to generate it again in case we ever
// change the grid item width.
let width = EMOJI_GRID_ITEM_WIDTH;
let _headerMediaQueries = "";
let _gridMediaQueries = "";
while (width < MAX_WIDTH) {
  _headerMediaQueries += `
  @media (min-width: ${width + GRID_PADDING * 2}px) {
    padding-left: calc((100vw - ${width + GRID_PADDING * 2}px) / 2);
    padding-right: calc((100vw - ${width + GRID_PADDING * 2}px) / 2);
  }`;
  _gridMediaQueries += `
  @media (min-width: ${width + GRID_PADDING * 2}px) {
    max-width: ${width}px;
    min-width: ${width}px;
  }
  `;
  width += EMOJI_GRID_ITEM_WIDTH;
}

export const Header = styled.div`
  display: flex;
  position: relative;
  width: 100%;
  align-items: center;
  justify-content: center;
  scroll-margin-top: 100px;

  ${mediaQueries}

  @media (min-width: ${MAX_WIDTH + PADDING * 2}px) {
    padding-left: 0px;
    padding-right: 0px;
  }

  @media screen and (max-width: ${breakpointsArray[3]}) {
    padding: 0 10px;
    flex-direction: column;
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
  padding: 0 10px;
  justify-content: left;
  border-left: 1px solid ${darkColors.darkGray};

  &:after {
    left: 0;
  }

  @media screen and (max-width: ${breakpointsArray[3]}) {
    border: none;
    margin-left: 0;
    margin-right: 0;
    justify-content: center;
  }
`;

export const FilterOptionsWrapper = styled.div`
  ${WrapperCss}
  justify-content: right;
  padding-right: 20px;
  border-right: 1px solid ${darkColors.darkGray};

  &:after {
    right: 0;
  }

  @media screen and (max-width: ${breakpointsArray[3]}) {
    border: none;
    margin-left: 0;
    margin-right: 0;
    padding-right: 0;
  }
`;
