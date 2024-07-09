import { sumBytes } from "@sdk/utils/sum-emoji-bytes";
import useInputStore from "@store/input-store";
import { MAX_NUM_CHAT_EMOJIS, MAX_SYMBOL_LENGTH } from "components/pages/emoji-picker/const";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";

const textColorBySum = (sum: number, threshold: number) => {
  if (sum === 0 || sum > threshold) {
    return "text-error";
  }
  return "text-green";
};

export const ColoredBytesIndicator = ({ className = "" }: { className?: string }) => {
  const mode = useInputStore((s) => s.mode);
  const emojis = useInputStore((s) => s.emojis);
  const length = mode === "register" ? sumBytes(emojis) : emojis.length;
  const threshold = mode === "register" ? MAX_SYMBOL_LENGTH : MAX_NUM_CHAT_EMOJIS;
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    setNonce((n) => n + 1);
  }, [length]);

  return (
    <div className={"flex pixel-heading-4 uppercase" + className}>
      <motion.span
        key={nonce}
        animate={{
          scale: [1, 1.25, 1],
          transition: { duration: 0.1, repeat: 0 },
        }}
        style={{ scale: 1 }}
        className={textColorBySum(length, threshold) + " !no-underline"}
      >
        {length}
      </motion.span>
      <span className="text-white -rotate-[30deg] select-none">{"/"}</span>
      <span className="text-white">{`${threshold}${mode === "register" ? " bytes" : ""}`}</span>
    </div>
  );
};
