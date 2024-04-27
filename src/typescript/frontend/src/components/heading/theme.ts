import { css } from "styled-components";
import { scales } from "./types";

export const styles = {
  [scales.h1]: css`
    line-height: 1.28;
    font-size: 32px;
  `,
  [scales.h2]: css`
    line-height: 1.25;
    font-size: 28px;
  `,
  [scales.h3]: css`
    line-height: 1.25;
    font-size: 24px;
  `,
  [scales.h4]: css`
    line-height: 1.2;
    font-size: 20px;
  `,
};
