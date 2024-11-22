"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { translationFunction } from "context/language-context";
import { Column, Flex, FlexGap } from "@containers";
import { toCoinDecimalString } from "lib/utils/decimals";
import AptosIconBlack from "components/svg/icons/AptosBlack";
import Image from "next/image";
import Link from "next/link";
import { ROUTES } from "router/routes";
import { useLabelScrambler } from "../table-card/animation-variants/event-variants";
import planetHome from "../../../../../../public/images/planet-home.png";
import { emojiNamesToPath } from "utils/pathname-helpers";
import { type HomePageProps } from "app/home/HomePage";
import { emoji } from "utils";
import { Emoji } from "utils/emoji";
import { useEventStore } from "context/event-store-context";
import "./module.css";

export interface MainCardProps {
  featured?: HomePageProps["featured"];
  page: HomePageProps["page"];
  sortBy: HomePageProps["sortBy"];
}

const MainCard = (props: MainCardProps) => {
  const { featured: initialFeatured } = props;
  const { t } = translationFunction();
  const globeImage = useRef<HTMLImageElement>(null);

  const firehose = useEventStore((s) => s.stateFirehose);
  const [featured, setFeatured] = useState(initialFeatured);

  // The `featured` market from `props` is the one from the server component. Since the featured market is currently
  // the latest market in terms of bump order, we need to update it when a new market is bumped.
  useEffect(() => {
    const latestBumpedMarket = firehose.at(0);
    if (latestBumpedMarket) {
      setFeatured(latestBumpedMarket);
    }
  }, [firehose]);

  const { marketCap, lastSwapVolume, allTimeVolume } = useMemo(() => {
    return {
      marketCap: BigInt(featured?.state.instantaneousStats.marketCap ?? 0),
      lastSwapVolume: BigInt(featured?.lastSwap.quoteVolume ?? 0),
      allTimeVolume: BigInt(featured?.state.cumulativeStats.quoteVolume ?? 0),
    };
  }, [featured]);

  /* eslint-disable react-hooks/exhaustive-deps */
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (globeImage.current) {
        const classlist = globeImage.current?.classList;
        if (!classlist.contains("hero-image-animation")) {
          classlist.add("hero-image-animation");
        }
      }
    }, 500);
    return () => {
      clearTimeout(timeout);
    };
  }, []);
  /* eslint-enable react-hooks/exhaustive-deps */

  const { ref: marketCapRef } = useLabelScrambler(toCoinDecimalString(marketCap, 2));
  const { ref: lastSwapVolumeRef } = useLabelScrambler(toCoinDecimalString(lastSwapVolume, 2));
  const { ref: allTimeVolumeRef } = useLabelScrambler(toCoinDecimalString(allTimeVolume, 2));

  return (
    <Flex justifyContent="center" width="100%" my={{ _: "20px", tablet: "70px" }} maxWidth="1872px">
      <Flex
        alignItems="center"
        justifyContent="center"
        maxWidth="100%"
        width="100%"
        flexDirection={{ _: "column", tablet: "row" }}
      >
        <Link
          href={
            featured
              ? `${ROUTES.market}/${emojiNamesToPath(featured.market.emojis.map((x) => x.name))}`
              : ROUTES.home
          }
          style={{
            position: "relative",
            alignItems: "center",
            marginLeft: "-8%",
            display: "flex",
          }}
        >
          <Image
            id="hero-image"
            alt="Planet"
            src={planetHome}
            ref={globeImage}
            placeholder="empty"
          />
          <Emoji
            className={`styled-emoji ${featured?.market.emojis.length === 1 ? "styled-single-emoji" : "styled-double-emoji"}`}
            emojis={featured?.market.emojis ?? emoji("black heart")}
          />
        </Link>

        <Column maxWidth="100%" ellipsis>
          <div className="flex flex-row items-center">
            <span className="text-medium-gray pixel-heading-text">HOT</span>
            <span>&nbsp;</span>
            <div>
              <Emoji className="pixel-heading-emoji" emojis={emoji("fire")} />
            </div>
          </div>
          <div
            className="display-font-text ellipses font-forma-bold"
            title={(featured ? featured.market.symbolData.name : "BLACK HEART").toUpperCase()}
          >
            {(featured ? featured.market.symbolData.name : "BLACK HEART").toUpperCase()}
          </div>

          <FlexGap gap="8px">
            {typeof featured !== "undefined" && (
              <>
                <div className="font-forma text-medium-gray market-data-text uppercase">
                  {t("Mkt. Cap:")}
                </div>
                <div className="font-forma text-white market-data-text uppercase">
                  <div className="flex flex-row items-center justify-center">
                    <div ref={marketCapRef}>{toCoinDecimalString(marketCap, 2)}</div>
                    &nbsp;
                    <AptosIconBlack className={"icon-inline mb-[0.3ch]"} />
                  </div>
                </div>
              </>
            )}
          </FlexGap>

          <FlexGap gap="8px">
            {typeof featured !== "undefined" && (
              <>
                <div className="font-forma text-medium-gray market-data-text uppercase">
                  {t("All-time vol:")}
                </div>
                <div className="font-forma text-white market-data-text uppercase">
                  <div className="flex flex-row items-center justify-center">
                    <div ref={allTimeVolumeRef}>{toCoinDecimalString(allTimeVolume, 2)}</div>
                    &nbsp;
                    <AptosIconBlack className={"icon-inline mb-[0.3ch]"} />
                  </div>
                </div>
              </>
            )}
          </FlexGap>

          <FlexGap gap="8px">
            {typeof featured !== "undefined" && (
              <>
                <div className="uppercase">
                  <div className="font-forma text-medium-gray market-data-text uppercase">
                    {t("Last swap vol:")}
                  </div>
                </div>
                <div className="font-forma text-white market-data-text uppercase">
                  <div className="flex flex-row items-center justify-center">
                    <div ref={lastSwapVolumeRef}>{toCoinDecimalString(lastSwapVolume, 2)}</div>
                    &nbsp;
                    <AptosIconBlack className={"icon-inline mb-[0.3ch]"} />
                  </div>
                </div>
              </>
            )}
          </FlexGap>
        </Column>
      </Flex>
    </Flex>
  );
};

export default MainCard;
