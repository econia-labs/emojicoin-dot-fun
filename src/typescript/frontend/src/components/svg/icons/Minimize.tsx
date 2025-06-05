import React from "react";

const Minimize: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, ...props }) => {
  return (
    <div
      {...props}
      className={`h-[12px] w-[12px] rounded-full bg-amber-500 ${className}`}
      style={{
        boxShadow: "rgba(0, 0, 0, 0.42) 0px 0px 2px 1px inset",
      }}
    ></div>
  );
};

export default Minimize;
