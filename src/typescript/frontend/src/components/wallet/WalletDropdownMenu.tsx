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
import { EXTERNAL_LINK_PROPS } from "components/link";
import { translationFunction } from "context/language-context";
import { useAptos } from "context/wallet-context/AptosContextProvider";
import { Copy, LogOut, User, UserRound } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { ROUTES } from "router/routes";
import { zIndices } from "theme/base";
import { useScramble } from "use-scramble";
import { emoji } from "utils";
import { Emoji } from "utils/emoji";

import { formatDisplayName } from "@/sdk/utils/misc";

import ScrambledDropdownItem from "../dropdown-menu/ScrambledDropdownItem";

const WIDTH = "24ch";

const WalletDropdownMenu = () => {
  const { t } = translationFunction();
  const { disconnect, wallet } = useWallet();
  const { account, addressName, copyAddress } = useAptos();
  const [enabled, setEnabled] = useState(true);
  const router = useRouter();

  const text = useMemo(() => {
    if (addressName) {
      return formatDisplayName(addressName);
    } else {
      return t("Connected");
    }
  }, [addressName, t]);

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
      className="relative flex flex-col items-center gap-4"
      style={{ width: WIDTH, maxWidth: WIDTH, minWidth: WIDTH }}
    >
      <DropdownMenu>
        <DropdownTrigger asChild className="focus:outline-none">
          <button className="" onMouseOver={() => handleReplay(enabled, replay)}>
            <div className="flex flex-row text-2xl text-ec-blue">
              <Emoji
                className="mt-1.5 flex animate-flicker text-base drop-shadow-voltage"
                emojis={emoji("high voltage")}
              />
              <p
                className="text-overflow-ellipsis overflow-hidden whitespace-nowrap"
                style={{ width, maxWidth: width }}
                ref={ref}
              />
              <Emoji
                className="mt-1.5 flex animate-flicker text-base drop-shadow-voltage"
                emojis={emoji("high voltage")}
              />
            </div>
          </button>
        </DropdownTrigger>
        <DropdownContent
          sideOffset={4}
          className={
            "flex min-w-[155px] cursor-pointer flex-col rounded-[3px] bg-ec-blue pl-[2px] text-xl uppercase text-black"
          }
          style={{
            zIndex: zIndices.tooltip,
          }}
          align="center"
          side="bottom"
        >
          <DropdownArrow className="fill-ec-blue" visibility="visible" />
          {wallet && isAptosConnectWallet(wallet) && (
            <a href={APTOS_CONNECT_ACCOUNT_URL} {...EXTERNAL_LINK_PROPS}>
              <ScrambledDropdownItem scrambleText="Account" icon={<User className="h-4 w-4" />} />
            </a>
          )}
          <ScrambledDropdownItem
            onSelect={() => router.push(`${ROUTES.wallet}/${account?.address}`)}
            scrambleText="My emojicoins"
            icon={<UserRound className="h-4 w-4" />}
          />
          <ScrambledDropdownItem
            onSelect={copyAddress}
            scrambleText="Copy address"
            icon={<Copy className="h-4 w-4" />}
          />
          <ScrambledDropdownItem
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
