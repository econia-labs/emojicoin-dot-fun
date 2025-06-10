import { cn } from "lib/utils/class-name";
import { useScramble } from "use-scramble";

import StyledButton from "@/components/button/styled";

import ArenaExitInfo from "./ArenaExitInfo";

const textClassName = cn("text-ec-blue font-pixelar uppercase leading-6 text-2xl");

export default function ArenaExitButton({
  text = "Exit",
  onClick,
  summaryPage = false,
}: {
  text?: string;
  onClick: () => void;
  summaryPage?: boolean;
}) {
  const { ref, replay } = useScramble({
    text,
    overdrive: false,
    speed: 0.5,
  });

  return (
    <div className="relative flex gap-2 justify-between">
      <div className="absolute -bottom-5 w-full flex items-center justify-center gap-1">
        <span className="uppercase font-pixelar text-light-gray whitespace-nowrap text-sm">
          {"Does this sell?"}
        </span>
        <ArenaExitInfo summaryPage={summaryPage} />
      </div>
      <StyledButton
        className="inline-flex gap-1"
        onClick={onClick}
        onMouseOver={replay}
        onFocus={replay}
      >
        <span className={textClassName}> {"{"} </span>
        <div className="flex flex-row">
          <span
            className={textClassName}
            ref={ref}
            style={{
              minWidth: `${text.length + 1}ch`,
              textAlign: "center",
            }}
          />
        </div>
        <span className={textClassName}> {"}"} </span>
      </StyledButton>
    </div>
  );
}
