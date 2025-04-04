import "styled-components";

import type { CustomTheme } from "./theme";

declare module "styled-components" {
  export interface DefaultTheme extends CustomTheme {}
}
