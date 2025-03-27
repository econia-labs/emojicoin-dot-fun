// cspell:word Noto

const CANVAS_SIZE = 50;
const SAME_COLOR_THRESHOLD = 30;

// Set up the canvas
const offscreenCanvas: OffscreenCanvas | HTMLCanvasElement = new OffscreenCanvas(
  CANVAS_SIZE,
  CANVAS_SIZE
);

// Function to get color distance (for grouping similar colors)
function getColorDistance(color1: string, color2: string): number {
  const [r1, g1, b1] = color1.split(",").map(Number);
  const [r2, g2, b2] = color2.split(",").map(Number);
  return Math.sqrt(Math.pow(r2 - r1, 2) + Math.pow(g2 - g1, 2) + Math.pow(b2 - b1, 2));
}

// Function to average colors in a group
function averageColors(colors: string[]): string {
  const sum = colors.reduce(
    (acc, color) => {
      const [r, g, b] = color.split(",").map(Number);
      acc.r += r;
      acc.g += g;
      acc.b += b;
      return acc;
    },
    { r: 0, g: 0, b: 0 }
  );

  const count = colors.length;
  return `${Math.round(sum.r / count)},${Math.round(sum.g / count)},${Math.round(sum.b / count)}`;
}

// Draw emoji on canvas and return true if successfully rendered
function drawEmojiOnCanvas(
  emoji: string,
  ctx: OffscreenCanvasRenderingContext2D | CanvasRenderingContext2D,
  canvas: OffscreenCanvas | HTMLCanvasElement,
  fontFamily?: string
): boolean {
  // Clear canvas to transparent
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Noto font has some weird y offset compared to apple emojis, so we make sure the emoji size is smaller than the canvas.
  ctx.font = `${CANVAS_SIZE / 2}px ${fontFamily || "sans-serif"}`;
  // Some emojis such as ⚕️ on apple require a fillStyle, otherwise they are black
  ctx.fillStyle = "#086CD9";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(emoji, canvas.width / 2, canvas.height / 2);

  // Check if we got any visible pixels
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] > 0) {
      // Only check alpha channel
      return true;
    }
  }

  return false;
}

// Group similar colors from image data
function groupSimilarColors(imageData: ImageData): Map<string, string[]> {
  const data = imageData.data;
  const colorGroups = new Map<string, string[]>();

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const a = data[i + 3];

    // Skip fully transparent pixels.
    if (a === 0) continue;

    // Skip fully black pixels
    if (r + g + b === 0) continue;

    const color = `${r},${g},${b}`;
    let foundGroup = false;

    // Try to add to existing group
    for (const [groupColor, colors] of colorGroups) {
      if (getColorDistance(color, groupColor) < SAME_COLOR_THRESHOLD) {
        colors.push(color);
        foundGroup = true;
        break;
      }
    }

    // Create new group if no similar colors found
    if (!foundGroup) {
      colorGroups.set(color, [color]);
    }
  }

  return colorGroups;
}

// Find dominant color group and return average RGB with saturation weighting
function findDominantColor(colorGroups: Map<string, string[]>) {
  // Find the largest color group with saturation weighting
  let maxWeightedCount = 0;
  let dominantGroup: string[] | null = null;

  for (const [_, colors] of colorGroups) {
    // Calculate saturation-weighted count for this group
    const weightedCount = colors.reduce((acc, color) => {
      const [r, g, b] = color.split(",").map(Number);
      // Calculate saturation: difference between max and min RGB components
      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      const saturation = max === 0 ? 0 : (max - min) / max;
      // Add 1 + saturation weight to count (ensures even grayscale colors get some weight)
      return acc + (1 + saturation);
    }, 0);

    if (weightedCount > maxWeightedCount) {
      maxWeightedCount = weightedCount;
      dominantGroup = colors;
    }
  }

  if (!dominantGroup) {
    throw new Error("No dominant color group found");
  }

  // Average the colors in the dominant group
  const avgColor = averageColors(dominantGroup);
  const [r, g, b] = avgColor.split(",").map(Number);
  return { r, g, b };
}

function componentToHex(c: number) {
  const hex = c.toString(16);
  return hex.length == 1 ? "0" + hex : hex;
}

function rgbToHex(r: number, g: number, b: number) {
  return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
}

/**
 * Returns the dominant color of an emoji as a string in the format 'rgb(r,g,b)'.
 *
 * This function works by rendering the emoji on a canvas, analyzing the image data,
 * grouping similar colors, and finding the most dominant color group.
 *
 * @param emoji - The emoji character to analyze
 * @param fontFamily - Optional font family to use when rendering the emoji
 * @param _canvas - Optional canvas element to use for rendering (will use a global canvas if not provided)
 * @returns A string representing the dominant RGB color in the format 'rgb(r,g,b)'
 *
 * @example
 * ```typescript
 * const dominantColor = getEmojiDominantColor('😀', 'Apple Color Emoji');
 * ```
 */
export function getEmojiDominantColor(
  emoji: string,
  fontFamily?: string,
  canvasOverride?: HTMLCanvasElement
) {
  const canvas = canvasOverride || offscreenCanvas;
  canvas.height = CANVAS_SIZE;
  canvas.width = CANVAS_SIZE;
  const ctx = canvas.getContext("2d", {
    willReadFrequently: true,
  }) as OffscreenCanvasRenderingContext2D | CanvasRenderingContext2D;

  drawEmojiOnCanvas(emoji, ctx, canvas, fontFamily);

  // Get final image data
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const colorGroups = groupSimilarColors(imageData);
  try {
    const rgb = findDominantColor(colorGroups);
    return formatRgb(rgb);
  } catch (e) {
    console.error(`Error getting dominant color for emoji: ${emoji}`, e);
    return formatRgb({ r: 0, g: 0, b: 0 });
  }
}

export function formatRgb({ r, g, b }: { r: number; g: number; b: number }) {
  return {
    rgb: { r, g, b },
    rgbString: `rgb(${r}, ${g}, ${b})`,
    hexString: rgbToHex(r, g, b),
  };
}
