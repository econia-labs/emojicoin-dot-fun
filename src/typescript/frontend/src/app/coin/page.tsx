import React from "react";
import CoinDetailsBody from "componentsV2/Coin/CoinDetailsBody";
import CoinDetailsHeader from "componentsV2/Coin/CoinDetailsHeader";

const CoinComponent = async (): Promise<JSX.Element> => {
  return (
    <div className="relative overflow-hidden pt-[120px] md:pt-[130px] lg:pt-[130px]">
      <CoinDetailsHeader />
      <CoinDetailsBody />
    </div>
  );
};

export default CoinComponent;
