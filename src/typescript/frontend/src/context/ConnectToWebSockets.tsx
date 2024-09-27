import { useWebSocketClient } from "./event-store-context/hooks";
import { motion } from "framer-motion";
import { hexToRgba } from "utils/hex-to-rgba";

export const ConnectToWebSockets = () => {
  const { connected, received } = useWebSocketClient((s) => ({
    connected: s.connected,
    received: s.received,
  }));

  return (
    <>
      {process.env.NODE_ENV === "development" && (
        <div className="relative w-full h-full">
          <div className="absolute top-4 right-4 z-[100] flex flex-col">
            <div className="m-auto">{connected ? "🟢" : "⚫"}</div>
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
