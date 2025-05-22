import { type AnimationControls, motion } from "framer-motion";
import type { ReactElement } from "react";

import MobileMenuItem from "@/components/header/components/mobile-menu-item/mobile-menu-item";

const AnimatedDropdownItem = ({
  title,
  icon,
  onClick,
  controls,
}: {
  title: string;
  icon: ReactElement;
  onClick?: () => void;
  controls: AnimationControls;
}) => {
  return (
    <>
      <div className="relative">
        <motion.div
          className="overflow-hidden flex items-center"
          animate={controls}
          initial={{ height: 0 }}
          exit={{ height: 0 }}
        >
          <MobileMenuItem title={title} icon={icon} onClick={onClick} noBorder />
        </motion.div>
      </div>
    </>
  );
};

export default AnimatedDropdownItem;
