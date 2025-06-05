import { DropdownItem as RadixDropdownItem } from "components/dropdown-menu";
import { motion } from "framer-motion";
import { cn } from "lib/utils/class-name";
import { type PropsWithChildren, type ReactElement, useState } from "react";
import { useScramble } from "use-scramble";

type DropdownItemProps = {
  onSelect?: () => void;
  scrambleText: string;
  icon?: ReactElement;
  rowWrapperClassName?: string;
  className?: string;
} & PropsWithChildren;

export default function ScrambledDropdownItem({
  onSelect,
  scrambleText,
  icon,
  children,
  rowWrapperClassName = "",
  className = "",
}: DropdownItemProps) {
  const [enabled, setEnabled] = useState(true);
  const { ref, replay } = useScramble({
    text: scrambleText,
    overdrive: false,
    overflow: false,
    speed: 0.6,
    playOnMount: false,
    onAnimationStart: () => setEnabled(false),
    onAnimationEnd: () => setEnabled(true),
  });

  return (
    <div className={cn("hover:bg-[#00000018]", rowWrapperClassName)}>
      <RadixDropdownItem
        onSelect={onSelect}
        className={cn("focus:outline-none", className)}
        onMouseEnter={() => {
          if (enabled) replay();
        }}
      >
        <motion.div whileTap={{ scale: 0.95 }} className="flex flex-row items-center gap-2 p-2">
          {icon}
          <span ref={ref}>{scrambleText}</span>
          {children}
        </motion.div>
      </RadixDropdownItem>
    </div>
  );
}
