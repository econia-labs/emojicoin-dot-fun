import { DataType } from "../../types";
import { HEADERS } from "../../constants";

export type TableHeaderProps = {
  item: (typeof HEADERS)[number];
  isLast: boolean;
  sortData: (sortBy: Exclude<keyof DataType, "pool">) => void;
};
