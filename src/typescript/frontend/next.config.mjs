// @ts-check

const isDebug = process.env.BUILD_DEBUG === "true";
// Turbo must be off for the below.
const styledComponentConfigOptions = {
  displayName: true,
  ssr: true,
  fileName: true,
  minify: false,
};
if (isDebug) {
  console.log("Using build debug.");
}
const debugConfigOptions = {
  productionBrowserSourceMaps: true,
  outputFileTracing: true,
  swcMinify: false,
  cleanDistDir: true,
  experimental: {
    serverMinification: false,
    serverSourceMaps: true,
  },
  // styledComponents: isDebug ? { ...styledComponentConfigOptions } : true,
};

/** @type {import('next').NextConfig} */
const nextConfig = {
  crossOrigin: "use-credentials",
  typescript: {
    tsconfigPath: "tsconfig.json",
  },
  compiler: {
    styledComponents: true,
    removeConsole: false,
  },
  ...(isDebug ? debugConfigOptions : {}),
  transpilePackages: ["@/sdk"],
  redirects: async () => {
    return [
      {
        source: "/emojicoin",
        destination: "/emojicoin/0",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
