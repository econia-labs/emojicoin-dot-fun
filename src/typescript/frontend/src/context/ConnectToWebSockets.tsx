// I was having trouble with getting this to load correctly earlier-
// I'll put this here for now, although I think it can be in the WebHooks context provider.

import { useEffect, useRef } from "react";
import { useEventStore, useWebSocketClient } from "./websockets-context";
import { motion } from "framer-motion";
import { hexToRgba } from "utils/hex-to-rgba";

export const ConnectToWebSockets = () => {
  const { connect, connected, disconnected, reconnecting, received } = useWebSocketClient((s) => ({
    connect: s.connect,
    connected: s.connected,
    disconnected: s.disconnected,
    reconnecting: s.reconnecting,
    received: s.received,
  }));

  const establishedInitialConnection = useRef(false);
  const eventStore = useEventStore((s) => s);

  useEffect(() => {
    const interval = setInterval(() => {
      if (connected) {
        establishedInitialConnection.current = true;
        clearInterval(interval);
      } else {
        connect(eventStore);
      }
    }, 1000);

    return () => {
      clearInterval(interval);
    };
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, []);

  return (
    <>
      {process.env.NODE_ENV === "development" && (
        <div className="relative w-full h-full">
          <div className="absolute top-4 right-4 z-[100] flex flex-col">
            <div className="m-auto">
              {connected ? "🟢" : disconnected ? "🔴" : reconnecting ? "🟣" : "⚫"}
            </div>
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
