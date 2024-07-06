import MobileMenuItem from "components/header/components/mobile-menu-item";
import { type AnimationControls, motion } from "framer-motion";
import { type ReactElement } from "react";

export const AnimatedBorder = ({ controls }: { controls: AnimationControls }) => (
  <motion.div
    animate={controls}
    initial={{ opacity: 0 }}
    className="absolute border-b border-dashed border-b-dark-gray bg-transparent h-[1px] w-full"
  />
);

export const AnimatedDropdownItem = ({
  title,
  icon,
  onClick,
  controls,
  borderControls,
}: {
  title: string;
  icon: ReactElement;
  onClick?: () => void;
  controls: AnimationControls;
  borderControls: AnimationControls;
}) => {
  return (
    <>
      <div className="relative">
        <motion.div className="overflow-hidden" animate={controls} initial={{ height: 0 }}>
          <MobileMenuItem
            title={title}
            withIcon={{
              icon,
              className: "flex flex-row h-full min-h-[40px] justify-center items-center",
            }}
            onClick={onClick}
            borderBottom={false}
          />
        </motion.div>
        <AnimatedBorder controls={borderControls} />
      </div>
    </>
  );
};

export default AnimatedDropdownItem;
