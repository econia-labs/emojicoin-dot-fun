"use server";

import { lightBlue, yellow } from "kolorist";

const stringifyJSON = <T>(data: T) =>
  JSON.stringify(data, (_, value) => (typeof value === "bigint" ? `${value}n` : value), 2);

const LINE_WIDTH = 100;
const LABEL_PADDING = 1;

/* eslint-disable */
export const serverLog = async <T extends Record<string, any> & { label?: string }>({
  data,
  label,
}: T) => {
  console.info("");
  const lenLabel = label?.length ?? 0;
  const [leftLen, rightLen] = [
    LINE_WIDTH / 2 - (Math.floor(lenLabel / 2) - LABEL_PADDING),
    LINE_WIDTH / 2 - (Math.ceil(lenLabel / 2) - LABEL_PADDING),
  ];
  console.info(
    [
      yellow("-".repeat(leftLen)),
      " ".repeat(LABEL_PADDING),
      lightBlue(label ?? ""),
      " ".repeat(LABEL_PADDING),
      yellow("-".repeat(rightLen)),
    ].join("")
  );
  console.info(stringifyJSON(data));
  console.info(yellow("-".repeat(leftLen + LABEL_PADDING + lenLabel + LABEL_PADDING + rightLen)));
  console.info("");
};
/* eslint-enable */
