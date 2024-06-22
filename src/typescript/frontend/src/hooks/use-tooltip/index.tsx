"use client";

import React, { useState } from "react";
import { usePopper } from "react-popper";
import { AnimatePresence } from "framer-motion";

import { Arrow, StyledTooltip } from "./styled";
import { type TooltipOptions } from "./types";
import { useSubscriptionEventsHandlers } from "./use-subscription-events-handlers";
import { checkIsEllipsis } from "utils";
import { appearanceAnimationMap, appearanceAnimationVariants } from "theme";
/**
 * Is used to display a tooltip when an element is hovered over.
 */
const useTooltip = (content: React.ReactNode, options?: TooltipOptions) => {
  const {
    placement = "auto",
    trigger = "hover",
    arrowPadding = 16,
    tooltipPadding = { left: 16, right: 16 },
    tooltipOffset = [0, 10],
    isEllipsis = false,
    hideTimeout = 100,
    showTimeout = 400,
    isInitiallyOpened = false,
    customStyles = {},
    arrowBorderColor = "econiaBlue",
  } = options ?? {};
  const [targetElement, setTargetElement] = useState<HTMLElement | null>(null);
  const [tooltipElement, setTooltipElement] = useState<HTMLElement | null>(null);
  const [arrowElement, setArrowElement] = useState<HTMLElement | null>(null);

  const { visible, setVisible } = useSubscriptionEventsHandlers({
    targetElement,
    tooltipElement,
    trigger,
    isInitiallyOpened,
    hideTimeout,
    showTimeout,
  });

  const { styles, attributes } = usePopper(targetElement, tooltipElement, {
    placement,
    modifiers: [
      {
        name: "arrow",
        options: { element: arrowElement, padding: arrowPadding },
      },
      { name: "offset", options: { offset: tooltipOffset } },
      { name: "preventOverflow", options: { padding: tooltipPadding } },
    ],
    strategy: "fixed",
  });

  const tooltip = (
    <StyledTooltip
      key="tooltip"
      {...appearanceAnimationMap}
      variants={appearanceAnimationVariants}
      transition={{ duration: 0.3 }}
      ref={setTooltipElement}
      style={{ ...customStyles?.tooltip, ...styles.popper }}
      arrowBorderColor={arrowBorderColor}
      {...attributes.popper}
    >
      <>{content || targetElement?.innerHTML}</>
      <Arrow
        ref={setArrowElement}
        style={{
          ...customStyles?.arrow,
          ...styles.arrow,
          transform: styles.arrow.transform && `${styles.arrow.transform} rotate(45deg)`,
        }}
      />
    </StyledTooltip>
  );

  const AnimatedTooltip = (
    <AnimatePresence>
      {isEllipsis ? checkIsEllipsis(targetElement) && visible && tooltip : visible && tooltip}
    </AnimatePresence>
  );

  return {
    targetRef: setTargetElement,
    tooltip: AnimatedTooltip,
    tooltipVisible: visible,
    setVisible,
    targetElement,
  };
};

export default useTooltip;
