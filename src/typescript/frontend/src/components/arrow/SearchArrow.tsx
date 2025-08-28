import type { ClassValue } from "clsx";
import { cn } from "lib/utils/class-name";

import Arrow from "../svg/icons/Arrow";

export default function SearchArrow({
  direction,
  className,
}: {
  direction: "left" | "right";
  className?: ClassValue;
}) {
  return (
    <Arrow
      className={cn("w-[11px] md:w-[12px] lg:w-[14px] xl:w-[18px]", className)}
      rotate={direction === "left" ? "180deg" : ""}
    />
  );
}
