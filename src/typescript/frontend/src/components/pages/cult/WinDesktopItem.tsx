// cspell:word textfile
// cspell:word mycomputer
// cspell:word recyclebin
// cspell:word desktopapp

import Text from "components/text";
import Image from "next/image";
import type { FC } from "react";

export enum WinIcons {
  TEXT_FILE = "images/textfile.svg",
  MY_COMPUTER = "images/mycomputer.svg",
  RECYCLE_BIN = "images/recyclebin.svg",
  DESKTOP_APP = "images/desktopapp.svg",
}

interface Props {
  icon: WinIcons;
  label: string;
  onClick: () => void;
}

export const WinDesktopItem: FC<Props> = ({ icon, label, onClick }) => {
  return (
    <div
      className="flex w-[150px] cursor-pointer flex-col items-center gap-3"
      onClick={() => onClick()}
    >
      <Image unoptimized width={64} height={64} src={icon} alt="desktop icon" />
      <div className="w-[200px]">
        <Text className="px-1" textAlign="center" textScale={"pixelBodySmall"} fontSize={"30px"}>
          {label}
        </Text>
      </div>
    </div>
  );
};

export const CommunityCreationWinDesktopItem: FC<Props & { pos: { x: number; y: number } }> = ({
  pos,
  ...rest
}) => {
  return (
    <>
      <div className={"block sm:hidden"}>
        <WinDesktopItem {...rest} />
      </div>
      <div
        className={"absolute hidden sm:block"}
        style={{
          left: pos.x,
          top: pos.y,
        }}
      >
        <WinDesktopItem {...rest} />
      </div>
    </>
  );
};
