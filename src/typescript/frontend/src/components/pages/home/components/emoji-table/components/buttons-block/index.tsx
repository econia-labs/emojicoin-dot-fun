"use client";

import React, { useCallback } from "react";

import { FlexGap } from "@containers";
import { Text } from "components/text";

import { Arrow } from "components/svg";
import { StyledBtn } from "./styled";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { getPageQueryPath } from "lib/queries/sorting/query-params";
import { type AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { useMarketData } from "context/store-context";

const ButtonsBlock: React.FC = () => {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const numMarkets = useMarketData((s) => s.numMarkets);

  const handleRouterAction = useCallback(
    ({ prev, routerFunction }: { prev: boolean; routerFunction: keyof AppRouterInstance }) => {
      const newPath = getPageQueryPath({
        prev,
        searchParams,
        pathname,
        numMarkets,
      });
      if (routerFunction === "push") {
        router.push(newPath, { scroll: false });
      } else if (routerFunction === "prefetch") {
        router.prefetch(newPath);
      }
    },
    [searchParams, pathname, router, numMarkets]
  );

  return (
    <FlexGap gap="17px" justifyContent="center" marginTop="30px">
      {/* Left */}
      <StyledBtn
        onMouseEnter={() =>
          handleRouterAction({
            prev: true,
            routerFunction: "prefetch",
          })
        }
        onClick={() =>
          handleRouterAction({
            prev: true,
            routerFunction: "push",
          })
        }
      >
        <Text textScale="pixelHeading2" fontSize="48px" color="darkGray">
          {"{"}
        </Text>

        <Arrow width="21px" rotate="180deg" />

        <Text textScale="pixelHeading2" fontSize="48px" color="darkGray">
          {"}"}
        </Text>
      </StyledBtn>

      {/* Right */}
      <StyledBtn
        onMouseEnter={() =>
          handleRouterAction({
            prev: false,
            routerFunction: "prefetch",
          })
        }
        onClick={() =>
          handleRouterAction({
            prev: false,
            routerFunction: "push",
          })
        }
      >
        <Text textScale="pixelHeading2" fontSize="48px" color="darkGray">
          {"{"}
        </Text>

        <Arrow width="21px" />

        <Text textScale="pixelHeading2" fontSize="48px" color="darkGray">
          {"}"}
        </Text>
      </StyledBtn>
    </FlexGap>
  );
};

export default ButtonsBlock;
