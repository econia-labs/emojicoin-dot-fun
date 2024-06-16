/* eslint-disable-next-line import/no-unused-modules */
export const sumBytes = (emojis: string[]) => {
  const encoder = new TextEncoder();
  return emojis.reduce((acc, emoji) => acc + encoder.encode(emoji).length, 0);
};
