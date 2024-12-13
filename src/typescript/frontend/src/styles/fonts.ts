import { CDN_URL } from "lib/env";

export const fontsStyle = `
  @font-face {
    font-family: Pixelar;
    font-style: normal;
    font-weight: 400;
    src: url("${CDN_URL}/fonts/Pixelar-Regular.woff2");
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
    --font-pixelar: Pixelar;
    --font-forma: Forma;
    --font-formaM: FormaM;
  }
`;
