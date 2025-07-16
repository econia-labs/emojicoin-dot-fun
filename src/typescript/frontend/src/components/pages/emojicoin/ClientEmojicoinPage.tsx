"use client";

import { Text } from "components";
import Carousel from "components/carousel";
import { useEventStore } from "context/event-store-context";
import FEATURE_FLAGS from "lib/feature-flags";
import { GlobeIcon } from "lucide-react";
import Link from "next/link";
import React, { useEffect } from "react";
import { ROUTES } from "router/routes";
import { darkColors } from "theme";

import { Box } from "@/containers";
import { useReliableSubscribe } from "@/hooks/use-reliable-subscribe";
import { useTailwindBreakpoints } from "@/hooks/use-tailwind-breakpoints";

import DesktopGrid from "./components/desktop-grid";
import MainInfo from "./components/main-info/MainInfo";
import MobileGrid from "./components/mobile-grid";
import type { EmojicoinProps } from "./types";

const ClientEmojicoinPage = (props: EmojicoinProps) => {
  const { lg } = useTailwindBreakpoints();
  const loadMarketStateFromServer = useEventStore((s) => s.loadMarketStateFromServer);
  const loadEventsFromServer = useEventStore((s) => s.loadEventsFromServer);

  useEffect(() => {
    const { swaps, state } = props.data;
    loadMarketStateFromServer([state]);
    loadEventsFromServer([...swaps]);

    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [props.data]);

  useReliableSubscribe({ eventTypes: ["Chat", "Swap"] });

  return (
    <Box>
      {FEATURE_FLAGS.Arena && props.isInMelee && (
        <Carousel gap={16}>
          <div className="flex flex-row items-center gap-[16px]">
            <Link href={ROUTES.arena}>
              <Text
                textScale="pixelHeading3"
                color="econiaBlue"
                className="w-max"
                textTransform="uppercase"
              >
                To trade this inside the melee, go to arena
              </Text>
            </Link>
            <GlobeIcon color={darkColors.econiaBlue} />
          </div>
        </Carousel>
      )}
      <MainInfo data={props.data} />
      {lg ? <DesktopGrid data={props.data} /> : <MobileGrid data={props.data} />}
    </Box>
  );
};

export default ClientEmojicoinPage;
