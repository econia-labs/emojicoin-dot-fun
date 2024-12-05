import React, { useEffect, useState } from "react";

import { translationFunction } from "context/language-context";
import { type MainInfoProps } from "../../types";
import { useEventStore } from "context/event-store-context";
import { motion } from "framer-motion";
import { getBondingCurveProgress } from "@sdk/utils/bonding-curve";
import Button from "components/button";
import Link from "next/link";
import { ROUTES } from "router/routes";
import { useThemeContext } from "context";
import { FormattedNumber } from "components/FormattedNumber";

const statsTextClasses = "uppercase ellipses font-forma text-[24px]";

const BondingProgress = ({ data }: MainInfoProps) => {
  const { t } = translationFunction();
  const { theme } = useThemeContext();

  const marketEmojis = data.symbolEmojis;
  const stateEvents = useEventStore((s) => s.getMarket(marketEmojis)?.stateEvents ?? []);

  const [bondingProgress, setBondingProgress] = useState(
    getBondingCurveProgress(data.state.state.clammVirtualReserves.quote)
  );

  useEffect(() => {
    if (stateEvents.length === 0) return;
    const event = stateEvents.at(0);
    if (event) {
      setBondingProgress(getBondingCurveProgress(event.state.clammVirtualReserves.quote));
    }
  }, [stateEvents]);

  return (
    <div className="flex flex-col w-fit">
      <div className="flex justify-between gap-[8px] mb-[.2em]">
        <div className={statsTextClasses + " text-light-gray font-pixelar text-[32px]"}>
          {t("Bonding progress:")}
        </div>
        <FormattedNumber
          value={bondingProgress}
          className={
            statsTextClasses + " text-ec-blue font-pixelar text-[32px] text-end min-w-[3.5em]"
          }
          suffix="%"
          scramble
        />
      </div>
      {bondingProgress >= 100 ? (
        <Link
          href={{
            pathname: ROUTES.pools,
            query: { pool: data.emojis.map((e) => e.emoji).join("") },
          }}
        >
          <Button scale="lg">{t("Provide liquidity")}</Button>
        </Link>
      ) : (
        <div
          style={{
            width: "100%",
            border: `1px solid ${theme.colors.darkGray}`,
            padding: "0.15em",
            borderRadius: "5px",
          }}
        >
          <motion.div
            initial={{ width: "0%" }}
            animate={{ width: `${Math.max(bondingProgress, 1).toFixed(2)}%` }}
            // Allow the page to load first so that users can actually see the animation.
            transition={{ delay: 0.3 }}
            style={{
              height: "0.8em",
              background: theme.colors.econiaBlue,
              borderRadius: "3px",
            }}
          ></motion.div>
        </div>
      )}
    </div>
  );
};

export default BondingProgress;
