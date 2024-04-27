import React from "react";
import { Input } from "components";
import { REGEX } from "configs";
import { InputProps } from "components/inputs/input/types";

export const InputNumeric = <E extends React.ElementType = "input">({
  onUserInput,
  ...props
}: InputProps<E> & { onUserInput: (value: string) => void }): JSX.Element => {
  const onChangeText = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value.replace(/,/g, ".");

    if (REGEX.numericInputRegex.test(value)) {
      onUserInput(value);
    }
  };

  return (
    <Input inputMode="decimal" pattern="^(?!\.)[0-9]*[.,]?[0-9]*$" onChange={event => onChangeText(event)} {...props} />
  );
};
