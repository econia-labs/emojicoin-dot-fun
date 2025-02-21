"use client";
import { useMemo } from "react";
import CoinCard from "./CoinCard";

const coinData = [
  {
    id: "1",
    title: "COIN TITLE",
    time: "2 min",
    value: "$675,4534.99",
    change: "+30.65%",
    description: "1% of every trade goes to Greenpeace.  Loremmet Lorem Ypsum Lor...",
  },
  {
    id: "2",
    title: "COIN TITLE",
    time: "2 min",
    value: "$675,4534.99",
    change: "+30.65%",
    description: "1% of every trade goes to Greenpeace.  Loremmet Lorem Ypsum Lor...",
  },
  {
    id: "3",
    title: "COIN TITLE",
    time: "2 min",
    value: "$675,4534.99",
    change: "+30.65%",
    description: "1% of every trade goes to Greenpeace.  Loremmet Lorem Ypsum Lor...",
  },
];

const CoinsList = (): JSX.Element => {
  const renderedCoins = useMemo(() => {
    return coinData.map((coin, index) => (
      <CoinCard
        key={index}
        id={coin.id}
        title={coin.title}
        time={coin.time}
        value={coin.value}
        change={coin.change}
        description={coin.description}
      />
    ));
  }, []);
  return <>{renderedCoins}</>;
};

export default CoinsList;
