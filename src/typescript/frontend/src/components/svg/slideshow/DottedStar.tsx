import { type SVGMotionProps, motion } from "framer-motion";
import * as React from "react";
import { type Ref, forwardRef, memo } from "react";
import { AnimateDottedSVG } from "./AnimateDottedSVG";
const SvgComponent = (
  { width = 142, height = 148, ...props }: SVGMotionProps<SVGSVGElement>,
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
    <AnimateDottedSVG d="M71.297 10.28 91.26 44.773l.063-9.175L71.303 1l-.006 9.28Z" />
    <AnimateDottedSVG d="M71.297 10.28 50.888 44.705l-.063-9.17L71.303 1l-.006 9.28Z" />
    <AnimateDottedSVG d="m70.998 78.553-20.11-33.848-.063-9.175c6.725 11.32 13.449 22.633 20.179 33.953v9.07h-.006Z" />
    <AnimateDottedSVG d="m71 78.553 20.262-33.78.063-9.175L71 69.488v9.066ZM36.552 49.801 1.22 69.61 1 78.68l35.442-19.87.11-9.008Z" />
    <AnimateDottedSVG d="M36.552 49.801s-.08 5.92-.11 9.008l.11-9.008Z" />
    <AnimateDottedSVG d="m70.997 69.442-34.445-19.64-.11 9.007 34.555 19.703v-9.07Z" />
    <AnimateDottedSVG d="m36.441 89.784 34.556-20.342v9.07L36.33 98.917l.11-9.133Z" />
    <AnimateDottedSVG d="M1.22 69.61c11.74 6.726 23.478 13.453 35.222 20.174l-.11 9.133C24.556 92.175 12.776 85.427 1 78.68l.226-9.07H1.22ZM105.442 49.801l35.332 19.808.226 9.07-35.447-19.87-.111-9.008Z" />
    <AnimateDottedSVG d="M105.442 49.801s.079 5.92.111 9.008l-.111-9.008Z" />
    <AnimateDottedSVG d="m70.997 69.441 34.446-19.64.11 9.008-34.556 19.703v-9.07Z" />
    <AnimateDottedSVG d="m105.558 89.784-34.56-20.343v9.07l34.67 20.406-.11-9.133Z" />
    <AnimateDottedSVG d="M140.776 69.61a77525.902 77525.902 0 0 1-35.222 20.174l.11 9.133c11.775-6.742 23.556-13.49 35.332-20.238l-.226-9.07h.006ZM70.998 69.441l-20.11 33.849-.063 9.175c6.725-11.32 13.449-22.634 20.179-33.953v-9.07h-.006Z" />
    <AnimateDottedSVG d="m71.297 137.72-20.409-34.43-.063 9.175L71.303 147l-.006-9.28ZM71 69.441l20.262 33.786.063 9.17L71 78.512v-9.07Z" />
    <AnimateDottedSVG d="m71.297 137.72 19.963-34.493.063 9.17L71.303 147l-.006-9.28Z" />
  </motion.svg>
);
const ForwardRef = forwardRef(SvgComponent);
const DottedStar = memo(ForwardRef);
export default DottedStar;
