/* eslint-disable-next-line import/no-unused-modules */
export const compareBigInt = (a: bigint, b: bigint): number => {
  if (a > b) {
    return 1;
  }
  if (a < b) {
    return -1;
  }
  return 0;
};
