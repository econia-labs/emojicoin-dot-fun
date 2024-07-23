export const prettifyEmojiName = (name: string) => {
  return name
    .replace(/: (light|medium-light|medium|medium-dark|dark|) skin tone/g, "")
    .replace(/, beard/g, ": beard")
    .replace(/flag: /g, "");
};
