"use client";
import React from "react";

const ProgressBar = (): JSX.Element => {
  return (
    <div className="flex-box w-full mb-10">
      <h4 className="text-white title-w30 text-lg font-semibold mt-12">BONDING CURVE PROGRESS</h4>
      <div className="w-full px-2 rounded-full progress-line flex items-center mt-12">
        <div className="progress rounded-full"></div>
        <h6 className="text-secondary text-md font-semibold">53%</h6>
      </div>
    </div>
  );
};

export default ProgressBar;
