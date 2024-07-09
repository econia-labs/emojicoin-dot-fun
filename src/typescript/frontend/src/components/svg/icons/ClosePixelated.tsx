import React, { type SVGProps } from "react";

const ClosePixelated = ({ width = 15, height = 16, ...props }: SVGProps<SVGSVGElement>) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={width}
      height={height}
      fill="none"
      stroke="none"
      viewBox="0 0 11 12"
      {...props}
    >
      <path
        fill="currentColor"
        d="M0 10.698V8.715h1.984v1.983H0Zm1.984-1.983V6.69h2.024v2.025H1.984Zm2.024-4.008h1.984V6.69H4.008V4.707Zm4.008 4.008H5.992V6.69h2.024v2.025ZM10 10.698H8.016V8.715H10v1.983ZM1.984 2.682h2.024v2.025H1.984V2.682ZM0 .698h1.984v1.984H0V.698Zm8.016 1.984v2.025H5.992V2.682h2.024ZM10 .698v1.984H8.016V.698H10Z"
      />
    </svg>
  );
};

export default ClosePixelated;
