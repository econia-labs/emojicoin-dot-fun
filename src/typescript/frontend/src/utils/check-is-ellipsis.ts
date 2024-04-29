/**
 * It's used inside tooltip to detect if element is ellipse inside the container. If so show tooltip
 * @param element
 */

export const checkIsEllipsis = (element: HTMLElement | null) => {
  if (element) {
    return element.offsetWidth < element.scrollWidth;
  }

  return false;
};
