import { useScramble } from "use-scramble";

const scrambleConfig = {
  // ASCII numbers only.
  range: [48, 57] as [number, number],
  overdrive: false,
  overflow: true,
  speed: 0.6,
  playOnMount: true,
};

export const useLabelScrambler = (value: string, suffix: string = "", prefix: string = "") => {
  // Ignore all characters in the prefix and the suffix, as long as they are not numbers.
  const ignore = ["."];
  const numberSet = new Set("0123456789");
  const suffixesAndPrefixes = new Set(prefix + suffix);
  for (const char of suffixesAndPrefixes) {
    if (!numberSet.has(char)) {
      ignore.push(char);
    }
  }

  const scrambler = useScramble({
    text: prefix + value + suffix,
    ...scrambleConfig,
    ignore,
  });

  return scrambler;
};
