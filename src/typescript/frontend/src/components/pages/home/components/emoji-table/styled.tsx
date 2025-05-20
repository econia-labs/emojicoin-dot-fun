"use client";

import styled from "styled-components";
import base, { breakpointsArray } from "theme/base";
import { darkColors } from "theme/colors";

import { EMOJI_GRID_ITEM_WIDTH, MAX_WIDTH } from "../const";

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

export const StyledGrid = styled.div`
  display: grid;
  position: relative;
  grid-template-columns: repeat(auto-fill, ${EMOJI_GRID_ITEM_WIDTH}px);
  justify-content: center;
  gap: 0;
  width: 100%;
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
