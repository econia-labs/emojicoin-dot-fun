import { useMemo } from "react";
import { useWindowSize } from "react-use";
import { EMOJI_GRID_ITEM_WIDTH } from "../../const";
import { GRID_PADDING } from "../styled";

export const MAX_ELEMENTS_PER_LINE = 7;

export const useGridItemsPerLine = () => {
  const { width } = useWindowSize();
  const itemsPerLine = useMemo(() => {
    const num = Math.floor((width - GRID_PADDING * 2) / EMOJI_GRID_ITEM_WIDTH);
    return Math.min(num, MAX_ELEMENTS_PER_LINE);
  }, [width]);

  return itemsPerLine;
};
