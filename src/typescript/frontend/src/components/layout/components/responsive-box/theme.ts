import { Config, system } from "styled-system";

const getAspectRatio = (aspectRatio: number) => (1 / aspectRatio) * 100 + "%";

const config: Config = {
  aspectRatio: {
    property: "paddingTop",
    transform: getAspectRatio,
  },
};

export const aspectRatio = system(config);
