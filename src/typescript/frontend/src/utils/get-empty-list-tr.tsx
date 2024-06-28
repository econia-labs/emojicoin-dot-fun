import React from "react";

export const getEmptyListTr = (height: number, dataLength: number, Element: React.FC) => {
  const count = Math.ceil((height - dataLength * 34) / 34);
  const emptyListLength = count > 0 ? count : 0;

  return Array(emptyListLength + 1)
    .fill("")
    .map((_, index) => <Element key={"empty list" + index} />);
};
