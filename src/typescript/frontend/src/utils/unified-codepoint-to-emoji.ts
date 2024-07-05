export const unifiedCodepointsToEmoji = (val: `${string}-${string}`) => {
  const codepoints = val.split("-").map((codepoint) => parseInt(codepoint, 16));
  const emojis = codepoints.map((codepoint) => String.fromCodePoint(codepoint));
  const emojiString = emojis.join("");
  return emojiString;
};
