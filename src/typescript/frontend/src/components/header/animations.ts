export const slideTopVariants = (offsetHeight: number) => ({
  hidden: {
    y: -150,
    height: 0,
    opacity: 0,
  },
  visible: {
    y: 0,
    opacity: 1,
    height: `${offsetHeight}px`,
    transition: {
      duration: 0.3,
      type: "easyInOut",
    },
  },
});
