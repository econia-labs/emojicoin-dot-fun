import { cn } from "lib/utils/class-name";

import Info from "@/components/info";

export default function ArenaExitInfo({
  infoClassName,
  summaryPage = false,
}: {
  infoClassName?: string;
  summaryPage?: boolean;
}) {
  return (
    <Info infoIconClassName={cn(infoClassName, "w-3 h-3")}>
      <div>
        {(summaryPage ? "No, exiting" : "Exiting") + " the melee only withdraws your escrowed"}
        {" emojicoins to your account. "}
        <br />
        <br />
        {"If you wish to fully exit to APT, you must market sell the "}
        {" emojicoins after exiting."}
      </div>
    </Info>
  );
}
