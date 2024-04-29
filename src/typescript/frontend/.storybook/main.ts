import type { StorybookConfig } from "@storybook/react-webpack5";
const config: StorybookConfig = {
  stories: ["../src/**/*.stories.mdx", "../src/**/*.stories.@(js|jsx|ts|tsx)"],
  addons: ["@storybook/preset-create-react-app"],
  framework: {
    name: "@storybook/react-webpack5",
    options: {},
  },

  staticDirs: ["../public"],
};
export default config;
