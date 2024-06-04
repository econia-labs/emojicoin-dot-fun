import { type GridProps } from "components/pages/emojicoin/types";
import { motion, useAnimation } from "framer-motion";
import { useEffect, useState } from "react";
import { getBondingCurveProgress } from "utils/bonding-curve";

export const AnimatedProgressBar: React.FC<GridProps> = ({ data }) => {
    const [progress, setProgress] = useState(getBondingCurveProgress(data.clammVirtualReserves));
    const sparklerControls = useAnimation();
    const progressControls = useAnimation();

    useEffect(() => {
      progressControls.start({
        width: `${progress}%`,
        transition: { type: 'spring', stiffness: 100, damping: 20 },
      });

      sparklerControls.start({
        opacity: [0.6, 1, 0.6],
        transition: { duration: 0.5, repeat: Infinity, repeatType: 'mirror' },
      });
    }, [progress, progressControls, sparklerControls]);

    useEffect(() => {
      const percentage = getBondingCurveProgress(data.clammVirtualReserves);
      setProgress(percentage);
    /* eslint-disable-next-line */
    }, [data.clammVirtualReserves, data.numSwaps]);

  return (
    <div className="relative w-full h-6 bg-gray-300 rounded-full overflow-hidden">
      <motion.div
        className="absolute top-0 left-0 h-full bg-blue-500"
        style={{ width: `${progress}%` }}
        animate={progressControls}
      >
        <motion.div
          className="absolute top-0 right-0 h-full w-4 bg-yellow-400 rounded-full"
          animate={sparklerControls}
        />
      </motion.div>
    </div>
  );
};
