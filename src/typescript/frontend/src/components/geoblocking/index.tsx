import React from "react";

import Text from "components/text";

const Item: React.FC = () => {
  return (
    <div className="flex items-center justify-center min-w-[fit-content] gap-[16px]">
      <Text
        className="h-[2.4rem] whitespace-nowrap uppercase"
        lineHeight="2.4rem"
        textScale="display6"
        color="black"
        textAlign="center"
        fontWeight="600"
      >
        You are accessing our products and services from a restricted jurisdiction. We do not allow
        access from certain jurisdictions including locations subject to sanctions restrictions and
        other jurisdictions where our services are ineligible for use. For more information, see our
        Terms of Use.
      </Text>
    </div>
  );
};

export const GeoblockedBanner: React.FC = () => (
  <div className="w-full bg-pink">
    <div className="overflow-hidden w-full flex-row">
      <div className="flex">
        <div className="flex gap-[16px] animate-banCarousel">
          {Array.from({ length: 4 }).map((_, i) => (
            <Item key={i} />
          ))}
        </div>
      </div>
    </div>
  </div>
);
