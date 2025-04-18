import debounce from "lodash/debounce";
import { useCallback, useEffect, useState } from "react";

import type { useSubscriptionEventsHandlersProps } from "./types";

export const useSubscriptionEventsHandlers = ({
  targetElement,
  tooltipElement,
  trigger,
  isInitiallyOpened,
  hideTimeout,
  showTimeout,
}: useSubscriptionEventsHandlersProps) => {
  const [visible, setVisible] = useState(isInitiallyOpened);

  // TODO: Fix this mess.
  /* eslint-disable @typescript-eslint/no-use-before-define */
  const debouncedHide = debounce((e) => {
    hideTooltip(e);
  }, hideTimeout);

  const debouncedShow = debounce((e) => {
    showTooltip(e);
  }, showTimeout);

  const hideTooltip = useCallback(
    (e: Event) => {
      e.stopPropagation();
      e.preventDefault();
      setVisible(false);
      debouncedShow.cancel();
    },
    [debouncedShow]
  );

  const showTooltip = useCallback(
    (e: Event) => {
      e.stopPropagation();
      e.preventDefault();
      setVisible(true);
      debouncedHide.cancel();
    },
    [debouncedHide]
  );
  /* eslint-enable @typescript-eslint/no-use-before-define */

  const toggleTooltip = useCallback(
    (e: Event) => {
      if (tooltipElement?.contains(e.target as Node) && targetElement?.contains(e.target as Node)) {
        // Should be handled in component with useTooltip hook
        // Ex.: const { targetRef, tooltip, setVisible } = useTooltip(...)
        //      function onDropdownMenuClick() {setVisible(false);}
        return;
      }

      e.stopPropagation();
      setVisible((v) => !v);
    },
    [tooltipElement, targetElement, setVisible]
  );

  // Trigger = hover
  useEffect(() => {
    if (targetElement === null || trigger !== "hover") return undefined;

    targetElement.addEventListener("mouseenter", debouncedShow);
    targetElement.addEventListener("mouseleave", debouncedHide);

    return () => {
      targetElement.removeEventListener("mouseenter", debouncedShow);
      targetElement.removeEventListener("mouseleave", debouncedHide);
    };
  }, [trigger, targetElement, debouncedHide, debouncedShow]);

  // Keep tooltip open when cursor moves from the targetElement to the tooltip
  useEffect(() => {
    if (tooltipElement === null || trigger !== "hover") return undefined;

    tooltipElement.addEventListener("mouseenter", debouncedShow);
    tooltipElement.addEventListener("mouseleave", debouncedHide);
    return () => {
      tooltipElement.removeEventListener("mouseenter", showTooltip);
      tooltipElement.removeEventListener("mouseleave", debouncedHide);
    };
  }, [trigger, tooltipElement, debouncedHide, debouncedShow, showTooltip]);

  // Trigger = click
  useEffect(() => {
    if (targetElement === null || trigger !== "click") return undefined;

    targetElement.addEventListener("click", toggleTooltip);

    return () => targetElement.removeEventListener("click", toggleTooltip);
  }, [trigger, targetElement, visible, toggleTooltip]);

  // Handle click outside
  useEffect(() => {
    if (trigger !== "click") return undefined;

    const handleClickOutside = ({ target }: Event) => {
      if (target instanceof Node) {
        if (
          tooltipElement != null &&
          targetElement != null &&
          !tooltipElement.contains(target) &&
          !targetElement.contains(target)
        ) {
          setVisible(false);
        }
      }
    };
    document.addEventListener("mousedown", handleClickOutside);

    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [trigger, targetElement, tooltipElement]);

  // Trigger = focus
  useEffect(() => {
    if (targetElement === null || trigger !== "focus") return undefined;

    targetElement.addEventListener("focus", debouncedShow);
    targetElement.addEventListener("blur", debouncedHide);
    return () => {
      targetElement.removeEventListener("focus", debouncedShow);
      targetElement.removeEventListener("blur", debouncedHide);
    };
  }, [trigger, targetElement, debouncedShow, debouncedHide]);

  return { visible, setVisible };
};
