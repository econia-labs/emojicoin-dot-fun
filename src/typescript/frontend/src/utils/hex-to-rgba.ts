/**
 * Converts a hexadecimal color code to an RGBA string.
 *
 * This function accepts short (e.g., "#FFF") and full (e.g., "#FFFFFF") hexadecimal color codes.
 * An optional alpha value can also be provided to set the opacity of the color.
 * The alpha defaults to 1 if not specified, representing full opacity.
 *
 * @param {string} hex - The hexadecimal color code to convert.
 * @param {number} [alpha=1] - The alpha (opacity) value of the color.
 * @returns {string} The RGBA color string.
 *
 * @example
 * // Convert full hex code to RGBA with default opacity
 * console.log(hexToRgba('#ff6347'));
 * // Output: "rgba(255, 99, 71, 1)"
 *
 * @example
 * // Convert full hex code to RGBA with 50% opacity
 * console.log(hexToRgba('#ff6347', 0.5));
 * // Output: "rgba(255, 99, 71, 0.5)"
 *
 * @example
 * // Convert shorthand hex code to RGBA with default opacity
 * console.log(hexToRgba('#FFF'));
 * // Output: "rgba(255, 255, 255, 1)"
 */
export function hexToRgba(
  hex: `#${string}`,
  alpha = 1
): `rgba(${number}, ${number}, ${number}, ${number})` {
  let r = 0,
    g = 0,
    b = 0;
  if (hex.length === 4) {
    r = parseInt(hex[1] + hex[1], 16);
    g = parseInt(hex[2] + hex[2], 16);
    b = parseInt(hex[3] + hex[3], 16);
  } else if (hex.length === 7) {
    r = parseInt(hex.substring(1, 3), 16);
    g = parseInt(hex.substring(3, 5), 16);
    b = parseInt(hex.substring(5, 7), 16);
  }
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
