// cspell:word noto
import { CDN_URL } from "lib/env";
import { Noto_Color_Emoji } from "next/font/google";

export const fontsStyle = `
  @font-face {
    font-family: 'Sifonn';
    src: url('/fonts/sifonn.woff') format('woff2');
    font-weight: 400;
    font-style: normal;
    font-display: swap;
  }

  @font-face {
    font-family: Lora;
    src: url('/fonts/Lora-Regular.woff') format('woff2');
    font-weight: 400;
    font-style: normal;
    font-display: swap;
  }

  @font-face {
    font-family: Lora;
    font-style: normal;
    font-weight: 400;
    src: url('/fonts/Lora-Regular.woff') format('woff2');
  }

  @font-face {
    font-family: Forma;
    font-style: normal;
    font-weight: 400;
    src: url("${CDN_URL}/fonts/FormaDJRMicro-Regular-Testing.woff2");
  }

  @font-face {
    font-family: FormaM;
    font-style: normal;
    font-weight: 400;
    src: url("${CDN_URL}/fonts/FormaDJRDisplay-Medium-Testing.woff2");
  }

  :root {
    --font-sifonn: 'Sifonn';
    --font-pixelar: Pixelar;
    --font-forma: Forma;
    --font-formaM: FormaM;
    --font-lora: Lora;
  }
`;

export const notoColorEmoji = Noto_Color_Emoji({
  weight: "400",
  style: ["normal"],
  subsets: ["emoji"],
  preload: true,
  display: "swap",
  variable: "--font-noto-color-emoji",
});
