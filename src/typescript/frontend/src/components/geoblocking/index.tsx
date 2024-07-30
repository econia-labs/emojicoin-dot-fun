import React from "react";

import Text from "components/text";

const Item: React.FC = () => {
  return (
    <div className="flex items-center justify-center min-w-[fit-content] gap-[16px]">
      <Text
        className="h-[2.4rem] whitespace-nowrap"
        lineHeight="2.4rem"
        textScale="display6"
        color="black"
        textAlign="center"
        fontWeight="600"
      >
        {"blah ".repeat(40).toUpperCase()}
      </Text>
    </div>
  );
};

export const GeoblockedBanner: React.FC = () => {
  const items: React.ReactNode[] = [];
  for (let i = 0; i < 4; i++) {
    items.push(<Item key={i} />);
  }
  return (
    <div className="w-full bg-pink">
      <div className="overflow-hidden w-full flex-row">
        <div className="flex">
          <div className="flex gap-[16px] animate-banCarousel">{items}</div>
        </div>
      </div>
    </div>
  );
};
