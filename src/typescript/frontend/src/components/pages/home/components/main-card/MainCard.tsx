"use client";

import React, { useEffect, useRef, useState } from "react";

import { translationFunction } from "context/language-context";
import { Column, Flex, FlexGap } from "@containers";
import { toCoinDecimalString } from "lib/utils/decimals";
import AptosIconBlack from "components/svg/icons/AptosBlack";
import Image from "next/image";
import Link from "next/link";
import { ROUTES } from "router/routes";
import { useEventStore, useWebSocketClient } from "context/state-store-context";
import { type fetchFeaturedMarket } from "lib/queries/sorting/market-data";
import { emojisToName } from "lib/utils/emojis-to-name-or-symbol";
import { useLabelScrambler } from "../table-card/animation-variants/event-variants";
import planetHome from "../../../../../../public/images/planet-home.png";
import { emojiNamesToPath } from "utils/pathname-helpers";
import { type HomePageProps } from "app/home/HomePage";
import "./module.css";

export interface MainCardProps {
  featured?: Awaited<ReturnType<typeof fetchFeaturedMarket>>;
  page: HomePageProps["page"];
  sortBy: HomePageProps["sortBy"];
  searchBytes: HomePageProps["searchBytes"];
}

const MainCard = (props: MainCardProps) => {
  const { featured } = props;
  const { t } = translationFunction();
  const globeImage = useRef<HTMLImageElement>(null);
  const marketID = featured?.marketID.toString() ?? "-1";
  const stateEvents = useEventStore((s) => s.getMarket(marketID)?.stateEvents ?? []);
  const subscribe = useWebSocketClient((s) => s.subscribe);
  const requestUnsubscribe = useWebSocketClient((s) => s.requestUnsubscribe);

  // TODO: [ROUGH_VOLUME_TAG_FOR_CTRL_F]
  // See the other todo note with the same tag.
  const [marketCap, setMarketCap] = useState(BigInt(featured?.marketCap ?? 0));
  const [roughDailyVolume, setRoughDailyVolume] = useState(BigInt(featured?.dailyVolume ?? 0));
  const [roughAllTimeVolume, setRoughAllTimeVolume] = useState(
    BigInt(featured?.allTimeVolume ?? 0)
  );

  useEffect(() => {
    if (stateEvents.length === 0 || !featured) return;
    // TODO: Refactor this to have accurate data. We increment by 1 like this just to trigger a scramble animation.
    setMarketCap((prev) => prev + 1n);
    setRoughDailyVolume((prev) => prev + 1n);
    setRoughAllTimeVolume((prev) => prev + 1n);
  }, [featured, stateEvents]);

  /* eslint-disable react-hooks/exhaustive-deps */
  useEffect(() => {
    subscribe.state(marketID);
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
      requestUnsubscribe.state(marketID);
    };
  }, []);

  useEffect(() => {
    subscribe.state(marketID);
    if (featured) {
      setMarketCap(BigInt(featured.marketCap));
      setRoughDailyVolume(BigInt(featured.dailyVolume));
      setRoughAllTimeVolume(BigInt(featured.allTimeVolume));
    }
    return () => {
      requestUnsubscribe.state(marketID);
    };
  }, [featured, marketID]);
  /* eslint-enable react-hooks/exhaustive-deps */

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
          href={
            featured
              ? `${ROUTES.market}/${emojiNamesToPath(featured.emojis.map((x) => x.name))}`
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

          {[...new Intl.Segmenter().segment(featured?.symbol ?? "🖤")].length == 1 ? (
            <div className="styled-emoji styled-single-emoji">{featured?.symbol ?? "🖤"}</div>
          ) : (
            <div className="styled-emoji styled-double-emoji">{featured?.symbol}</div>
          )}
        </Link>

        <Column maxWidth="100%" ellipsis>
          <div className="pixel-heading-1 text-dark-gray pixel-heading-text">00</div>
          <div
            className="display-font-text ellipses font-forma-bold"
            title={(featured ? emojisToName(featured.emojis) : "BLACK HEART").toUpperCase()}
          >
            {(featured ? emojisToName(featured.emojis) : "BLACK HEART").toUpperCase()}
          </div>

          <FlexGap gap="8px">
            {typeof featured !== "undefined" && (
              <>
                <div className="font-forma text-dark-gray market-data-text uppercase">
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
                <div className="text-dark-gray uppercase">
                  <div className="font-forma text-dark-gray market-data-text uppercase">
                    {t("24 hour vol:")}
                  </div>
                </div>
                <div className="font-forma text-white market-data-text uppercase">
                  <div className="flex flex-row items-center justify-center">
                    <div ref={dailyVolumeRef}>{toCoinDecimalString(roughDailyVolume, 2)}</div>
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
                <div className="font-forma text-dark-gray market-data-text uppercase">
                  {t("All-time vol:")}
                </div>
                <div className="font-forma text-white market-data-text uppercase">
                  <div className="flex flex-row items-center justify-center">
                    <div ref={allTimeVolumeRef}>{toCoinDecimalString(roughAllTimeVolume, 2)}</div>
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
