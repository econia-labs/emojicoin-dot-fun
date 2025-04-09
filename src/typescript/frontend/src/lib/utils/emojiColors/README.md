<!---
cspell:word noto
-->

# Emoji Color Generator

This utility generates dominant color data for emoji characters.
The generated color data is used throughout the application
for styling elements based on emoji selections.

## Overview

The `emoji-color-generator` is a React component that:

1. Extracts the dominant color from emoji characters using canvas rendering
1. Can generate color data for both symbol emojis and chat emojis
1. Supports different font families (Apple emoji and Noto Color Emoji)

## How It Works

The generator works by:

1. Rendering emojis to a canvas element
1. Analyzing the pixel data to determine the dominant color
1. Converting that color to a hexadecimal string
1. Creating a mapping of emoji characters to their dominant colors

## Requirements

### Browser Environment Required

The generator **must** run in a browser context
because it depends on the HTML Canvas API, which is not available in Node.js

### Device Requirements for Font Families

- **Apple Emoji**: To generate accurate color data for Apple emoji,
  you **must** use a macOS or iOS device.
  Other platforms will not have access to the Apple emoji font.
- **Noto Color Emoji**: Available across platforms,
  this is used as a fallback for non-Apple devices.

## Generating Color Data

Color data must be generated separately for each font family and emoji set.
This separation allows for:

1. Dynamic importing of only the needed color data
1. Smaller bundle sizes in production
1. Font-specific color accuracy

### Testing and Generation

You can test and generate emoji color data by
visiting the page at `/dev/color-generator`

The interface provides:

- A color checker to test individual emojis
- A data generator that creates JSON mappings for all emojis in a selected set
- Options to switch between font families and emoji types (symbol/chat)
- Copy to clipboard functionality for the generated data
