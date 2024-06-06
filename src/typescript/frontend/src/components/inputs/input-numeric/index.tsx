import React from "react";
import { Input } from "components/inputs/input";
import { type InputProps } from "components/inputs/input/types";

const NUMBERS = new Set("0123456789");

export const InputNumeric = <E extends React.ElementType = "input">({
  onUserInput,
  ...props
}: InputProps<E> & { onUserInput: (value: string) => void }): JSX.Element => {
  const [input, setInput] = React.useState("");

  const onChangeText = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value.replace(/,/g, ".").replace(/^0+/, "0");

    let hasDecimal = false;
    let s = "";
    for (const char of value) {
      if (char === ".") {
        if (!hasDecimal) {
          s += char;
        } else {
          hasDecimal = true;
        }
      } else if (NUMBERS.has(char)) {
        s += char;
      }
    }

    if (s === "" || !isNaN(Number(s))) {
      setInput(s);
      onUserInput(s);
    }
  };

  return (
    <Input
      inputMode="decimal"
      pattern="^\d*\.?\d*$"
      onChange={(event) => onChangeText(event)}
      value={input}
      {...props}
    />
  );
};
