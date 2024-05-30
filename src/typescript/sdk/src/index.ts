import dotenv from "dotenv";
import path from "path";

// Load environment variables for test.
const VERCEL = process.env.VERCEL === "1";
if (!VERCEL && typeof window !== "undefined") {
  const sdkPath = path.resolve(__dirname, "../.env");
  dotenv.config({ path: sdkPath });
  const frontendPath = path.resolve(__dirname, "../../frontend/.env");
  dotenv.config({ path: frontendPath });
}

export * from "./const";
export * from "./emoji_data";
export * from "./emojicoin_dot_fun";
export * from "./markets";
export * from "./types";
export * from "./utils";
