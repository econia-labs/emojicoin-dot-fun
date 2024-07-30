const DURATION = 0.3;
const INSERTION_DELAY = 0.2;
const PER_ELEMENT_DELAY = 0.02;

export const tableCardVariants = {
  unshift: (_idx: number) => ({
    opacity: [0, 1],
    scale: [0, 1],
    transition: {
      duration: DURATION,
      type: "spring",
      scale: {
        duration: DURATION - INSERTION_DELAY,
        delay: INSERTION_DELAY,
      },
    },
  }),
  backwards: (_idx: number) => ({
    opacity: [1, 0.5, 0.5, 0.5, 0.5, 1],
    scale: [1, 0, 0, 0, 0, 0, 1],
    transition: {
      duration: DURATION,
      ease: "easeInOut",
    },
  }),
  toNewLine: (_idx: number) => ({
    opacity: [1, 0.5, 0.3, 0.5, 1],
    scale: [1, 0, 0, 0, 1],
    transition: {
      duration: DURATION,
      ease: "easeInOut",
    },
  }),
  default: (_idx: number) => ({
    opacity: 1,
    scale: 1,
    transition: {
      duration: DURATION,
      type: "just",
    },
  }),
  initial: (idx: number) => ({
    opacity: [0, 1],
    scale: [1, 1],
    transition: {
      duration: 0,
      opacity: {
        duration: DURATION * 2,
        type: "just",
        delay: idx * PER_ELEMENT_DELAY,
      },
    },
  }),
};

export default tableCardVariants;
