import * as React from "react";

const EmojicoinLogo = ({ width = 52, height = 52, ...props }: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={width}
    height={height}
    viewBox="0 0 52 53"
    fill="currentColor"
    {...props}
  >
    <rect width={52} height={52} y={0.5} fill="currentColor" rx={26} />
    <path
      fill="#086CD9"
      d="M35.532 16.968v-3.816h-19.07v3.816h-3.81v19.064h3.81v3.816h19.07v-3.816h3.816V16.968h-3.816Zm-17.694.772h3.953v3.952h-3.953V17.74Zm16.324 14.432h-3.096v3.088H20.928v-3.088h-3.09v-7.048h3.953v6.184h8.418v-6.1h3.953v6.964Zm0-10.48h-3.953V17.74h3.953v3.952Z"
    />
  </svg>
);

export default EmojicoinLogo;
