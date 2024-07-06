import { DropdownItem } from "components/dropdown-menu";
import { motion } from "framer-motion";
import { type PropsWithChildren, type ReactElement, useState } from "react";
import { useScramble } from "use-scramble";

const handleReplay = (enabled: boolean, replay: () => void) => {
  if (enabled) {
    replay();
  }
};

export type WalletDropdownItemProps = {
  onSelect?: () => void;
  scrambleText: string;
  icon: ReactElement;
} & PropsWithChildren;

export const WalletDropdownItem = ({ onSelect, scrambleText, icon }: WalletDropdownItemProps) => {
  const [enabled, setEnabled] = useState(true);
  const { ref, replay } = useScramble({
    text: scrambleText,
    overdrive: false,
    overflow: false,
    speed: 0.7,
    playOnMount: false,
    onAnimationStart: () => setEnabled(false),
    onAnimationEnd: () => setEnabled(true),
  });

  return (
    <DropdownItem
      onSelect={onSelect}
      className="hover:bg-[#00000018] focus:outline-none"
      onMouseEnter={() => handleReplay(enabled, replay)}
    >
      <motion.div whileTap={{ scale: 0.95 }} className="flex flex-row gap-2 items-center p-2">
        {icon}
        <span ref={ref}>{scrambleText}</span>
      </motion.div>
    </DropdownItem>
  );
};
