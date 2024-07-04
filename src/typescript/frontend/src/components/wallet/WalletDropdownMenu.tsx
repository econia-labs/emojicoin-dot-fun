import { useWallet } from "@aptos-labs/wallet-adapter-react";
import {
  DropdownArrow,
  DropdownContent,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
} from "components/dropdown-menu";
import React, { useCallback, useMemo, useState } from "react";
import { toast } from "react-toastify";
import { Copy, LogOut } from "lucide-react";
import { translationFunction } from "context/language-context";
import { truncateAddress } from "@sdk/utils/misc";
import { useScramble } from "use-scramble";
import { motion } from "framer-motion";

const WIDTH = "24ch";

const WalletDropdownMenu = () => {
  const { t } = translationFunction();
  const { account, disconnect } = useWallet();
  const [enabled, setEnabled] = useState(true);

  const text = useMemo(() => {
    if (account) {
      return truncateAddress(account.address);
    } else {
      return t("Connected");
    }
  }, [account, t]);

  const copyAddress = useCallback(async () => {
    if (!account?.address) return;
    try {
      await navigator.clipboard.writeText(account.address);
      toast.success("Copied address to clipboard! 📋", {
        pauseOnFocusLoss: false,
        autoClose: 2000,
      });
    } catch {
      toast.error("Failed to copy address to clipboard. 😓", {
        pauseOnFocusLoss: false,
        autoClose: 2000,
      });
    }
  }, [account?.address]);

  const { ref, replay } = useScramble({
    text,
    overdrive: false,
    overflow: false,
    speed: 0.6,
    playOnMount: false,
    onAnimationStart: () => setEnabled(false),
    onAnimationEnd: () => setEnabled(true),
  });

  const width = useMemo(() => {
    return `${text.length}ch`;
  }, [text]);

  const handleReplay = (enabled: boolean, replay: () => void) => {
    if (enabled) {
      replay();
    }
  };

  const [copyEnabled, setCopyEnabled] = useState(true);
  const { ref: copyRef, replay: copyReplay } = useScramble({
    text: "Copy address",
    overdrive: false,
    overflow: false,
    speed: 0.7,
    playOnMount: false,
    onAnimationStart: () => setCopyEnabled(false),
    onAnimationEnd: () => setCopyEnabled(true),
  });

  const [disconnectEnabled, setDisconnectEnabled] = useState(true);
  const { ref: disconnectRef, replay: disconnectReplay } = useScramble({
    text: "Disconnect",
    overdrive: false,
    overflow: false,
    speed: 0.7,
    playOnMount: false,
    onAnimationStart: () => setDisconnectEnabled(false),
    onAnimationEnd: () => setDisconnectEnabled(true),
  });

  return (
    <div
      className="relative flex flex-col gap-4 items-center"
      style={{ width: WIDTH, maxWidth: WIDTH, minWidth: WIDTH }}
    >
      <DropdownMenu>
        <DropdownTrigger asChild className="focus:outline-none">
          <button className="" onMouseOver={() => handleReplay(enabled, replay)}>
            <div className="flex flex-row text-ec-blue text-2xl">
              <p className="text-base flex mt-1.5 animate-flicker drop-shadow-voltage">{"⚡"}</p>
              <p
                className="uppercase whitespace-nowrap text-overflow-ellipsis overflow-hidden"
                style={{ width, maxWidth: width }}
                ref={ref}
              />
              <p className="text-base flex mt-1.5 animate-flicker drop-shadow-voltage">{"⚡"}</p>
            </div>
          </button>
        </DropdownTrigger>
        <DropdownContent
          sideOffset={4}
          className={
            "flex flex-col bg-ec-blue text-black text-xl uppercase cursor-pointer z-[50] " +
            "rounded-[3px] min-w-[146px] pl-[2px]"
          }
          align="center"
          side="bottom"
        >
          <DropdownArrow className="fill-ec-blue" visibility="visible" />
          <DropdownItem
            onSelect={copyAddress}
            className="hover:bg-[#00000018] focus:outline-none"
            onMouseEnter={() => handleReplay(copyEnabled, copyReplay)}
          >
            <motion.div whileTap={{ scale: 0.95 }} className="flex flex-row gap-2 items-center p-2">
              <Copy className="h-4 w-4" />
              <span ref={copyRef}>Copy address</span>
            </motion.div>
          </DropdownItem>
          <DropdownItem
            onSelect={disconnect}
            className="hover:bg-[#00000018] focus:outline-none"
            onMouseEnter={() => handleReplay(disconnectEnabled, disconnectReplay)}
          >
            <motion.div whileTap={{ scale: 0.95 }} className="flex flex-row gap-2 items-center p-2">
              <LogOut className="h-4 w-4" />
              <span ref={disconnectRef}>Disconnect</span>
            </motion.div>
          </DropdownItem>
        </DropdownContent>
      </DropdownMenu>
    </div>
  );
};

export default WalletDropdownMenu;
