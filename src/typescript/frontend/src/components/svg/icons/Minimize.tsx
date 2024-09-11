import React from "react";

const Minimize: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({className, ...props}) => {
  return (
    <div {...props} className={`rounded-full bg-amber-500 w-[12px] h-[12px] ${className}`} style={{
      boxShadow: "rgba(0, 0, 0, 0.42) 0px 0px 2px 1px inset",
    }}>
    </div>
  );
};

export default Minimize;
