import { motion, type SVGMotionProps } from "framer-motion";
import { ECONIA_BLUE } from "theme/colors";

const getAnimateConfig = (delay: number) => ({
  pathLength: [0, 1],
  transition: { duration: 2, times: [0, 1], delay },
});

export const AnimateDottedSVG = ({
  backgroundStroke = ECONIA_BLUE,
  delay = 0,
  ...props
}: { backgroundStroke?: string; delay?: number } & SVGMotionProps<SVGPathElement>) => {
  return (
    <>
      <motion.path
        stroke={"#000000ff"}
        strokeDasharray="2 2"
        strokeMiterlimit={10}
        strokeWidth={1}
        animate={getAnimateConfig(delay)}
        {...props}
      />
      <path
        stroke={backgroundStroke}
        strokeDasharray="2 2"
        strokeMiterlimit={10}
        d={props.d!.toString()}
      />
    </>
  );
};
