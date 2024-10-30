if (process.env.NODE_ENV !== "test") {
  require("server-only");
}

export * from "./const";
