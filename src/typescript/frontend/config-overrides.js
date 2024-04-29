// eslint-disable-next-line @typescript-eslint/no-var-requires
const ModuleScopePlugin = require("react-dev-utils/ModuleScopePlugin");

module.exports = function override(webpackConfig) {
  webpackConfig.module.rules.push({
    test: /\.mjs$/,
    include: /node_modules/,
    type: "javascript/auto",
  });

  webpackConfig.resolve.plugins = webpackConfig.resolve.plugins.filter(
    plugin => !(plugin instanceof ModuleScopePlugin),
  );

  webpackConfig.ignoreWarnings = [/Failed to parse source map/];

  return webpackConfig;
};
