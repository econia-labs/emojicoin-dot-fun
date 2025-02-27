"use client";
import React from "react";

const ProgressBar = ({
  title = "CORAL REEFS SAVED",
  progress = 53,
  variant = "blue",
}: {
  title?: string;
  progress: number;
  variant?: "blue" | "pink";
}): JSX.Element => {
  return (
    <div className="flex-box w-full">
      <h4 className="text-white title-w30 text-lg font-semibold mt-12">{title}</h4>
      <div className="w-full px-[3px] rounded-full progress-line flex items-center mt-12">
        <div className={`${variant === "pink" ? "progress-2" : "progress"} rounded-full`}></div>
        <h6
          className={`${variant === "pink" ? "text-[#D76B7B]" : "text-secondary"} text-md font-semibold ml-2`}
        >
          {progress}%
        </h6>
      </div>
    </div>
  );
};

export default ProgressBar;
