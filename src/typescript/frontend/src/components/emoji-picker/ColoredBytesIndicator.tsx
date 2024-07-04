import { sumBytes } from "@sdk/utils/sum-emoji-bytes";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";

const sum = (emojis: string[]) => sumBytes(emojis);
const textColorBySum = (sum: number, threshold: number) => {
  if (sum === 0 || sum > threshold) {
    return "text-error";
  }
  return "text-green";
};

export const ColoredBytesIndicator = ({
  emojis,
  numBytesThreshold,
}: {
  emojis: string[];
  numBytesThreshold: number;
}) => {
  const length = sum(emojis);
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    setNonce((n) => n + 1);
  }, [length]);

  return (
    <div className="flex pixel-heading-4 uppercase">
      <motion.span
        key={nonce}
        animate={{
          scale: [1, 1.25, 1],
          transition: { duration: 0.1, repeat: 0 },
        }}
        style={{ scale: 1 }}
        className={textColorBySum(length, numBytesThreshold)}
      >
        {length}
      </motion.span>
      <span className="text-white -rotate-[30deg]">{"/"}</span>
      <span className="text-white">{`${numBytesThreshold} bytes`}</span>
    </div>
  );
};
