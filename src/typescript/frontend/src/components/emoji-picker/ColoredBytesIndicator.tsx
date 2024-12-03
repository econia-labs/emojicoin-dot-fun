import { sumBytes } from "@sdk/utils/sum-emoji-bytes";
import { useEmojiPicker } from "context/emoji-picker-context";
import { MAX_NUM_CHAT_EMOJIS, MAX_SYMBOL_LENGTH } from "components/pages/emoji-picker/const";
import { AnimatedLoadingBoxes } from "components/pages/launch-emojicoin/animated-loading-boxes";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";

const isInvalidLength = (sum: number, threshold: number) => {
  return sum === 0 || sum > threshold;
};

export const MarketValidityIndicator = ({
  className = "",
  registered,
}: {
  className?: string;
  registered?: boolean;
}) => {
  const mode = useEmojiPicker((s) => s.mode);
  const emojis = useEmojiPicker((s) => s.emojis);
  const length = mode === "register" ? sumBytes(emojis) : emojis.length;
  const threshold = mode === "register" ? MAX_SYMBOL_LENGTH : MAX_NUM_CHAT_EMOJIS;
  const [nonce, setNonce] = useState(0);

  const invalidLength = isInvalidLength(length, threshold);

  useEffect(() => {
    setNonce((n) => n + 1);
  }, [length]);

  return (
    <div className="flex flex-row justify-between mb-[0.5ch]">
      <div className={"flex pixel-heading-4 uppercase " + className}>
        <motion.span
          key={nonce}
          animate={{
            scale: [1, 1.25, 1],
            transition: { duration: 0.1, repeat: 0 },
          }}
          style={{ scale: 1 }}
          className={"!no-underline " + (invalidLength ? "text-error" : "text-green")}
        >
          {length}
        </motion.span>
        <span className="text-white -rotate-[30deg] select-none">{"/"}</span>
        <span className="text-white">{`${threshold}${mode === "register" ? " bytes" : ""}`}</span>
      </div>
      {mode === "register" && (
        <div className="uppercase pixel-heading-4">
          {invalidLength ? (
            length > 10 ? (
              <div className="text-error">Too many bytes</div>
            ) : null
          ) : typeof registered === "undefined" ? (
            <AnimatedLoadingBoxes numSquares={4} />
          ) : registered ? (
            <div className="text-error">Already Registered</div>
          ) : (
            <div className="text-green">Ready to Register</div>
          )}
        </div>
      )}
    </div>
  );
};
