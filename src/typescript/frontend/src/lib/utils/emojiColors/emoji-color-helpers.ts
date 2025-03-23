// cspell:word Noto

const CANVAS_SIZE = 50;
const SAME_COLOR_THRESHOLD = 30;

// Set up the canvas
const canvas: OffscreenCanvas = new OffscreenCanvas(CANVAS_SIZE, CANVAS_SIZE);
const ctx: OffscreenCanvasRenderingContext2D | null = canvas.getContext("2d", {
  willReadFrequently: true,
});

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
  ctx: OffscreenCanvasRenderingContext2D,
  canvas: OffscreenCanvas
): boolean {
  // Clear canvas to transparent
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Try different font families for better emoji support
  const fonts = [
    `${CANVAS_SIZE}px system-ui`,
    `${CANVAS_SIZE}px Noto Color Emoji`,
    `${CANVAS_SIZE}px EmojiOne Color`,
    `${CANVAS_SIZE}px Apple Color Emoji`,
  ];

  // Try each font until we get a valid color
  for (const font of fonts) {
    ctx.font = font;
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

    // Clear canvas for next attempt
    ctx.clearRect(0, 0, canvas.width, canvas.height);
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

    // Skip fully transparent pixels
    if (a === 0) continue;

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

// Find dominant color group and return average RGB
function findDominantColor(colorGroups: Map<string, string[]>) {
  // Find the largest color group
  let maxCount = 0;
  let dominantGroup: string[] | null = null;

  for (const [_, colors] of colorGroups) {
    if (colors.length > maxCount) {
      maxCount = colors.length;
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

// Main function to get dominant color of a single emoji
export function getEmojiDominantColor(emoji: string) {
  drawEmojiOnCanvas(emoji, ctx!, canvas);

  // Get final image data
  const imageData = ctx!.getImageData(0, 0, canvas.width, canvas.height);
  const colorGroups = groupSimilarColors(imageData);
  const rgb = findDominantColor(colorGroups);
  return formatRgb(rgb);
}

export function formatRgb({ r, g, b }: { r: number; g: number; b: number }) {
  return {
    rgb: { r, g, b },
    rgbString: `rgb(${r}, ${g}, ${b})`,
    hexString: rgbToHex(r, g, b),
  };
}
