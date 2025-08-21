import fs from "fs";

import { generatedStaticHomePageData } from "./generate-data.js";

// This file should never be imported anywhere as it has top-level side effects.
if (import.meta.url !== `file://${process.argv[1]}`) {
  throw new Error("This file should never be imported.");
}

const outputDirectory = ".shared-build-data";

const main = async () => {
  const data = await generatedStaticHomePageData();
  if (!fs.existsSync(outputDirectory)) {
    fs.mkdirSync(outputDirectory, { recursive: true });
  }
  fs.writeFileSync(".shared-build-data/pages.json", JSON.stringify(data, null, 2));
};

// Only run if it's not the experimental compile only build mode.
if (!process.env.NEXT_EXPERIMENTAL_COMPILE) {
  main().then(() => console.info("Build time data generated!"));
}
