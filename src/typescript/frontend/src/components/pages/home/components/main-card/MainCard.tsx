"use client";

import React, { useEffect, useState } from "react";

import { translationFunction } from "context/language-context";
import useTooltip from "hooks/use-tooltip";
import { Column, Flex, FlexGap } from "@containers";
import {
  StyledEmoji,
  StyledPixelHeadingText,
  StyledDisplayFontText,
  StyledMarketDataText,
  StyledImage,
} from "./styled";
import { toCoinDecimalString } from "lib/utils/decimals";
import AptosIconBlack from "components/svg/icons/AptosBlack";
import "./module.css";
import Link from "next/link";
import { ROUTES } from "router/routes";
import { useEventStore, useMarketData, useWebSocketClient } from "context/websockets-context";
import { type fetchFeaturedMarket } from "lib/queries/sorting/market-data";
import { emojisToName } from "lib/utils/emojis-to-name-or-symbol";
import { useLabelScrambler } from "../animation-config";

export interface MainCardProps {
  featured?: Awaited<ReturnType<typeof fetchFeaturedMarket>>;
  totalNumberOfMarkets: number;
}

const MainCard = ({ featured, totalNumberOfMarkets }: MainCardProps) => {
  const { t } = translationFunction();
  const setNumMarkets = useMarketData((s) => s.setNumMarkets);

  const marketID = featured?.marketID.toString() ?? "-1";
  const stateEvents = useEventStore((s) => s.getMarket(marketID)?.stateEvents ?? []);
  const { subscribe, unsubscribe } = useWebSocketClient((s) => s);

  // TODO: [ROUGH_VOLUME_TAG_FOR_CTRL_F]
  // See the other todo note with the same tag.
  const [marketCap, setMarketCap] = useState(BigInt(featured?.marketCap ?? 0));
  const [roughDailyVolume, setRoughDailyVolume] = useState(BigInt(featured?.dailyVolume ?? 0));
  const [roughAllTimeVolume, setRoughAllTimeVolume] = useState(
    BigInt(featured?.allTimeVolume ?? 0)
  );

  useEffect(() => {
    if (stateEvents.length === 0) return;
    const latestEvent = stateEvents.at(0)!;
    const numSwapsInStore = latestEvent?.cumulativeStats.numSwaps ?? 0;
    if (numSwapsInStore > (featured?.numSwaps ?? -1)) {
      const marketCapInStore = latestEvent.instantaneousStats.marketCap;
      setMarketCap(marketCapInStore);
    }

    // TODO: Fix ASAP. This **will** become inaccurate over time.
    setRoughDailyVolume((prev) => prev + latestEvent.lastSwap.quoteVolume);
    setRoughAllTimeVolume((prev) => prev + latestEvent.lastSwap.quoteVolume);
  }, [featured, stateEvents]);

  /* eslint-disable react-hooks/exhaustive-deps */
  useEffect(() => {
    subscribe.state(marketID);
    return () => unsubscribe.state(marketID);
  }, []);
  /* eslint-enable react-hooks/exhaustive-deps */

  useEffect(() => {
    setNumMarkets(totalNumberOfMarkets);
  }, [totalNumberOfMarkets, setNumMarkets]);

  const { targetRef: targetRefEmojiName, tooltip: tooltipEmojiName } = useTooltip(undefined, {
    placement: "top",
    isEllipsis: true,
  });

  const { ref: marketCapRef } = useLabelScrambler(marketCap);
  const { ref: dailyVolumeRef } = useLabelScrambler(roughDailyVolume);
  const { ref: allTimeVolumeRef } = useLabelScrambler(roughAllTimeVolume);

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
          href={featured ? `${ROUTES.market}/${featured?.marketID.toString()}` : ROUTES.home}
          style={{
            position: "relative",
            alignItems: "center",
            marginLeft: "-8%",
            display: "flex",
          }}
        >
          <StyledImage
            id="hero-image"
            src="/images/planet-home.webp"
            aspectRatio={1.6}
            alt="Planet"
          />

          <StyledEmoji>{featured?.symbol ?? "🖤"}</StyledEmoji>
        </Link>

        <Column maxWidth="100%" ellipsis>
          <StyledPixelHeadingText textScale="pixelHeading1" color="darkGray">
            {"01"}
          </StyledPixelHeadingText>
          <StyledDisplayFontText ref={targetRefEmojiName} ellipsis>
            {(featured ? emojisToName(featured.emojis) : "BLACK HEART").toUpperCase()}
          </StyledDisplayFontText>

          <FlexGap gap="8px">
            {typeof featured !== "undefined" && (
              <>
                <StyledMarketDataText color="darkGray" textTransform="uppercase">
                  {t("Mkt. Cap:")}
                </StyledMarketDataText>
                <StyledMarketDataText>
                  <div className="flex flex-row items-center justify-center">
                    <div ref={marketCapRef}>{toCoinDecimalString(marketCap, 2)}</div>
                    &nbsp;
                    <AptosIconBlack className={"icon-inline mb-[0.3ch]"} />
                  </div>
                </StyledMarketDataText>
              </>
            )}
          </FlexGap>

          <FlexGap gap="8px">
            {typeof featured !== "undefined" && (
              <>
                <StyledMarketDataText color="darkGray" textTransform="uppercase">
                  {t("24 hour vol:")}
                </StyledMarketDataText>
                <StyledMarketDataText>
                  <div className="flex flex-row items-center justify-center">
                    <div ref={dailyVolumeRef}>{toCoinDecimalString(roughDailyVolume, 2)}</div>
                    &nbsp;
                    <AptosIconBlack className={"icon-inline mb-[0.3ch]"} />
                  </div>
                </StyledMarketDataText>
              </>
            )}
          </FlexGap>

          <FlexGap gap="8px">
            {typeof featured !== "undefined" && (
              <>
                <StyledMarketDataText color="darkGray" textTransform="uppercase">
                  {t("All-time vol:")}
                </StyledMarketDataText>
                <StyledMarketDataText>
                  <div className="flex flex-row items-center justify-center">
                    <div ref={allTimeVolumeRef}>{toCoinDecimalString(roughAllTimeVolume, 2)}</div>
                    &nbsp;
                    <AptosIconBlack className={"icon-inline mb-[0.3ch]"} />
                  </div>
                </StyledMarketDataText>
              </>
            )}
          </FlexGap>
        </Column>
        {tooltipEmojiName}
      </Flex>
    </Flex>
  );
};

export default MainCard;
