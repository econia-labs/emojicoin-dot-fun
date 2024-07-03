import * as React from "react";
import { type Ref, forwardRef, memo } from "react";
import { AnimateDottedSVG } from "./AnimateDottedSVG";
import { type SVGMotionProps, motion } from "framer-motion";
const SvgComponent = (
  { width = 128, height = 102, ...props }: SVGMotionProps<SVGSVGElement>,
  ref: Ref<SVGSVGElement>
) => (
  <motion.svg
    xmlns="http://www.w3.org/2000/svg"
    width={width}
    height={height}
    fill="none"
    ref={ref}
    {...props}
  >
    <AnimateDottedSVG d="m1 25.93-.354-.354.354.853v-.5Zm7.79-7.81v-.5h-.207l-.147.146.354.354Zm1.255-.5H9.73v1h.314v-1Zm-.941 0H8.79v1h.314v-1Zm-.668.146-.65.651.709.706.65-.65-.709-.706ZM6.49 19.72 5.19 21.02l.708.707 1.299-1.302-.708-.706Zm-2.597 2.603-1.298 1.302.708.706L4.6 23.028l-.708-.706Zm-2.597 2.603-.649.651.708.706.65-.65-.709-.707ZM1 26.43h1.028v-1H1v1Zm3.085 0H6.14v-1H4.085v1Zm4.113 0h2.057v-1H8.198v1Zm4.113 0h2.057v-1H12.31v1Zm4.113 0h2.057v-1h-2.057v1Zm4.114 0h2.056v-1h-2.056v1Zm4.113 0h2.056v-1h-2.056v1Zm4.113 0h2.056v-1h-2.056v1Zm4.113 0h2.056v-1h-2.056v1Zm4.113 0h1.028v-1H36.99v1Z" />
    <AnimateDottedSVG d="M82.293 26.076c0 12.257-9.913 22.196-22.14 22.196-12.225 0-22.139-9.939-22.139-22.196H1.146v74.822h118.015V26.076H82.293ZM126.626 93.096h.325v-74.83h-5.687" />
    <AnimateDottedSVG d="M74.57 42.916c-3.347 1.993-7.256 3.295-11.435 3.295-12.402 0-22.464-10.081-22.464-22.52H9.564M119.262 101l7.783-7.816M119.161 26.076l7.79-7.81M82.178 25.988l2.731-2.298M38.014 26.076l2.387-2.393" />
    <AnimateDottedSVG d="M9.903 23.69V5.718h107.973v18.047H84.694" />
    <AnimateDottedSVG d="M117.877 20.456h3.387V1H13.292v4.718M9.408 23.69h31.774" />
  </motion.svg>
);
const ForwardRef = forwardRef(SvgComponent);
const DottedInbox = memo(ForwardRef);
export default DottedInbox;
