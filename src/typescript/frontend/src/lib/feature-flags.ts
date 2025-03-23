const FEATURE_FLAGS = {
  Arena: process.env.NEXT_PUBLIC_ARENA_ENABLED === "true",
} as const;

export default FEATURE_FLAGS;
