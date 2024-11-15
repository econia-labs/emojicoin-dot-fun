import React from "react";

import Text from "components/text";
import Carousel from "components/carousel";
import useIsUserGeoblocked from "@hooks/use-is-user-geoblocked";

export const GeoblockedBanner = () => {
  // Don't show the banner unless `geoblocked` is explicitly true, not just true or undefined.
  const geoblocked = useIsUserGeoblocked({ explicitlyGeoblocked: true });

  return (
    geoblocked && (
      <div className="w-full bg-pink">
        <Carousel>
          <div className="flex items-center justify-center min-w-[fit-content] gap-[16px]">
            <Text
              className="h-[2.6rem] whitespace-nowrap uppercase"
              lineHeight="2.6rem"
              textScale="display6"
              color="black"
              textAlign="center"
              fontWeight="600"
            >
              You are accessing our products and services from a restricted jurisdiction. We do not
              allow access from certain jurisdictions including locations subject to sanctions
              restrictions and other jurisdictions where our services are ineligible for use. For
              more information, see our Terms of Use.
            </Text>
          </div>
        </Carousel>
      </div>
    )
  );
};
