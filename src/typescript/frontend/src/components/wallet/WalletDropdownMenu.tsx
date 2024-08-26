import {
  APTOS_CONNECT_ACCOUNT_URL,
  isAptosConnectWallet,
  useWallet,
} from "@aptos-labs/wallet-adapter-react";
import {
  DropdownArrow,
  DropdownContent,
  DropdownMenu,
  DropdownTrigger,
} from "components/dropdown-menu";
import React, { useMemo, useState } from "react";
import { User, Copy, LogOut } from "lucide-react";
import { translationFunction } from "context/language-context";
import { formatDisplayName } from "@sdk/utils/misc";
import { useScramble } from "use-scramble";
import { EXTERNAL_LINK_PROPS } from "components/link";
import { WalletDropdownItem } from "./WalletDropdownItem";
import { useAptos } from "context/wallet-context/AptosContextProvider";
import { useNameStore } from "context/state-store-context";

const WIDTH = "24ch";

const WalletDropdownMenu = () => {
  const { t } = translationFunction();
  const { account, disconnect, wallet } = useWallet();
  const { copyAddress } = useAptos();
  const [enabled, setEnabled] = useState(true);

  const nameResolver = useNameStore((s) =>
    s.getResolverWithNames(account?.address ? [account.address] : [])
  );

  const text = useMemo(() => {
    if (account) {
      return formatDisplayName(nameResolver(account.address));
    } else {
      return t("Connected");
    }
  }, [account, t, nameResolver]);

  const { ref, replay } = useScramble({
    text: text.startsWith("0x") ? `0x${text.slice(2).toUpperCase()}` : text.toUpperCase(),
    overdrive: false,
    overflow: false,
    speed: 0.6,
    playOnMount: false,
    onAnimationStart: () => setEnabled(false),
    onAnimationEnd: () => setEnabled(true),
  });

  const width = useMemo(() => {
    return `${text.length + 1}ch`;
  }, [text]);

  const handleReplay = (enabled: boolean, replay: () => void) => {
    if (enabled) replay();
  };

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
                className="whitespace-nowrap text-overflow-ellipsis overflow-hidden"
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
          {wallet && isAptosConnectWallet(wallet) && (
            <a href={APTOS_CONNECT_ACCOUNT_URL} {...EXTERNAL_LINK_PROPS}>
              <WalletDropdownItem scrambleText="Account" icon={<User className="h-4 w-4" />} />
            </a>
          )}
          <WalletDropdownItem
            onSelect={copyAddress}
            scrambleText="Copy address"
            icon={<Copy className="h-4 w-4" />}
          />
          <WalletDropdownItem
            onSelect={disconnect}
            scrambleText="Disconnect"
            icon={<LogOut className="h-4 w-4" />}
          />
        </DropdownContent>
      </DropdownMenu>
    </div>
  );
};

export default WalletDropdownMenu;
