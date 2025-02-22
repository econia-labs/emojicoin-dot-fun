"use client";
import React from "react";

const MarketCard = (): JSX.Element => {
  return (
    <div className="box-show px-5 mt-12 py-8 rounded-full round">
      <div className="mx-0 md:-mx-4 flex flex-wrap relative z-10">
        <div className="w-full px-10 sm-px-10 md:w-3/12 lg:w-3/12">
          <h4 className="mb-2 md:mb-0 text-xl md:text-2xl font-md md:font-bold text-center text-white dark:text-white">
            MKT CAP <br />
            $4,675,4534.99
          </h4>
        </div>
        <div className="w-full px-10 sm-px-10 md:w-3/12 lg:w-3/12">
          <h4 className="mb-2 md:mb-0 text-xl md:text-2xl font-md md:font-bold text-center text-white dark:text-white">
            24H VOLUME <br />
            $40,675,4534.99
          </h4>
        </div>
        <div className="w-full px-10 sm-px-10 md:w-3/12 lg:w-3/12">
          <h4 className="mb-2 md:mb-0 text-xl md:text-2xl font-md md:font-bold text-center text-white dark:text-white">
            ALL-TIME VOLUME <br />
            $400,675,4534.99
          </h4>
        </div>
        <div className="w-full px-10 sm-px-10 md:w-3/12 lg:w-3/12">
          <h4 className="mb-2 md:mb-0 text-xl md:text-2xl font-md md:font-bold text-center text-white dark:text-white">
            LAST SWAP <br />
            $400,675,4534.99
          </h4>
        </div>
      </div>
    </div>
  );
};

export default MarketCard;
