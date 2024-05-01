export const getFileNameFromSrc = (src: string): string => {
  const fileName = src.slice(src.lastIndexOf("/") + 1, src.lastIndexOf("."));
  return fileName;
};
