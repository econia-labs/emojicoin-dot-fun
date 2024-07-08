export const slideVariants = {
  hidden: {
    y: "100dvh",
    opacity: 0,
  },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      duration: 0.3,
      type: "easeInOut",
    },
  },
};
