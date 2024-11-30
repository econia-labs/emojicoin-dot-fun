// cspell:word bitget
import { cn } from "lib/utils/class-name";
import Image from "next/image";

const BitgetIcon = ({
  width,
  height,
  className,
}: {
  width: number;
  height: number;
  className: string;
}) => (
  <Image
    className={cn(className, "brightness-0")}
    width={width}
    height={height}
    alt="bitget logo"
    src="/bitget-logo.png"
  />
);
export default BitgetIcon;
