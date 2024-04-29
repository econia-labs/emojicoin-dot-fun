import React from "react";

import { Text } from "components";
import useMatchBreakpoints from "./use-match-breakpoints";

export default {
  title: "Hooks/UseMatchBreakpoint",
  argTypes: {},
};

export const UseMatchBreakpoint: React.FC = () => {
  const state = useMatchBreakpoints();

  return <Text>{JSON.stringify(state, null, 2)}</Text>;
};
