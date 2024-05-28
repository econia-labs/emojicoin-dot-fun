// @ts-check

const DEBUG = process.env.BUILD_DEBUG === "true";
const styledComponentsConfig = {
  displayName: true,
  ssr: true,
  fileName: true,
  minify: false,
};
const debugConfigOptions = {
  productionBrowserSourceMaps: true,
  outputFileTracing: true,
  swcMinify: false,
  cleanDistDir: true,
  experimental: {
    serverMinification: false,
    serverSourceMaps: true,
  },
};

/** @type {import('next').NextConfig} */
const nextConfig = {
  logging: {
    fetches: {
      fullUrl: true,
    },
  },
  crossOrigin: "use-credentials",
  typescript: {
    tsconfigPath: "tsconfig.json",
  },
  compiler: {
    styledComponents: DEBUG ? styledComponentsConfig : true,
    removeConsole: false,
  },
  ...(DEBUG ? debugConfigOptions : {}),
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
