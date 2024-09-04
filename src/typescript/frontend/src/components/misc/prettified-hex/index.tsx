import { cn } from "lib/utils/class-name";
import { prettifyHex } from "lib/utils/prettify-hex";
import { type HTMLAttributes } from "react";
import { useScramble, type UseScrambleProps } from "use-scramble";

export const PrettyHex = ({
  hex,
  scramble,
  ...props
}: { hex: `0x${string}` | Uint8Array } & {
  scramble?: UseScrambleProps | true;
} & HTMLAttributes<HTMLSpanElement>) => {
  const scrambleProps = typeof scramble === "object" ? scramble : {};
  const { ref } = useScramble({
    text: prettifyHex(hex),
    overdrive: false,
    overflow: true,
    speed: typeof scramble === "undefined" ? 0 : scrambleProps.speed ?? 0.6,
    playOnMount: true,
    ...scrambleProps,
  });

  return (
    <span ref={ref} className={cn("normal-case", props.className)} {...props}>
      {prettifyHex(hex)}
    </span>
  );
};
