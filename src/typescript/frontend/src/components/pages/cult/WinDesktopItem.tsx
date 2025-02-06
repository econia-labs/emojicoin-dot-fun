// cspell:word textfile

import Text from "components/text";
import Image from "next/image";
import { type FC } from "react";

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
      className="flex flex-col gap-3 cursor-pointer items-center w-[150px]"
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
      {/* useMatchBreakpoints seems to be unreliable. Need to duplicate this component and rely on tailwind for the breakpoints */}
      <div className={"mobile-sm:block mobile-lg:hidden"}>
        <WinDesktopItem {...rest} />
      </div>
      <div
        className={"mobile-sm:hidden mobile-lg:block absolute"}
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
