import Big from "big.js";
import React, { useEffect, useState } from "react";
import { isNumberInConstruction, countDigitsAfterDecimal, sanitizeNumber } from "@sdk/utils";

const intToStr = (value: bigint, decimals?: number) =>
  (Number(value) / 10 ** (decimals ?? 0)).toString();

const strToInt = (value: string, decimals?: number) => {
  if (isNaN(parseFloat(value))) {
    return 0n;
  }
  const res = Big(value.toString()).mul(Big(10 ** (decimals ?? 0)));
  if (res < Big(1)) {
    return 0n;
  }
  return BigInt(res.toString());
};

export const InputNumeric = ({
  onUserInput,
  decimals,
  value,
  onSubmit,
  ...props
}: {
  className?: string;
  onUserInput?: (value: bigint) => void;
  onSubmit?: (value: bigint) => void;
  decimals?: number;
  disabled?: boolean;
  value: bigint;
}) => {
  const [input, setInput] = useState(intToStr(value, decimals));

  useEffect(() => {
    if (strToInt(input, decimals) != value) {
      setInput(intToStr(value, decimals));
    }
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [value, decimals]);

  const onChangeText = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = sanitizeNumber(e.target.value);

    if (!isNumberInConstruction(value)) {
      return;
    }

    const decimalsInValue = countDigitsAfterDecimal(value);
    if (typeof decimals === "number" && decimalsInValue > decimals) {
      return;
    }

    setInput(value);
    if (onUserInput) {
      onUserInput(strToInt(value, decimals));
    }
  };

  return (
    <input
      type="text"
      onChange={(e) => onChangeText(e)}
      value={input}
      onKeyDown={(e) => {
        if (e.key === "Enter" && onSubmit) {
          onSubmit(strToInt(input, decimals));
        }
      }}
      {...props}
    />
  );
};
