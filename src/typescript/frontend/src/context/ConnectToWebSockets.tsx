import { useEventStore } from "./event-store-context/hooks";
import { motion } from "framer-motion";
import { emoji } from "utils";
import { Emoji } from "utils/emoji";
import { hexToRgba } from "utils/hex-to-rgba";

export const ConnectToWebSockets = () => {
  const connected = useEventStore((s) => s.connected);
  const received = useEventStore((s) => s.received);

  return (
    <>
      {process.env.NODE_ENV === "development" && (
        <div className="relative w-full h-full">
          <div className="absolute top-4 right-4 z-[100] flex flex-col">
            <Emoji className="m-auto">{connected ? emoji("green circle") : emoji("black circle")}</Emoji>
            <motion.div
              className="m-auto text-white font-pixelar uppercase text-2xl"
              key={received}
              animate={{ scale: 1, filter: `drop-shadow(0 0 4px ${hexToRgba("#FFFFFFFA")})` }}
              style={{ scale: 1.2, filter: `drop-shadow(0 0 0px ${hexToRgba("#FFFFFF00")})` }}
              transition={{ duration: 0.5, type: "spring" }}
            >
              {received}
            </motion.div>
          </div>
        </div>
      )}
    </>
  );
};
