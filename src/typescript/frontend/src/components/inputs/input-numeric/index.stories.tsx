import React, { useState } from "react";

import { InputNumeric as StyledInput } from "components";

export default {
  title: "Components/Inputs/InputNumeric",
};

export const InputNumeric: React.FC = () => {
  const [value, setValue] = useState("");

  return <StyledInput value={value} onUserInput={setValue} placeholder="Only numbers allowed" />;
};
