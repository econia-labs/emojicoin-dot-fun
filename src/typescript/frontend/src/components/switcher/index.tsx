import React from "react";
// Components
import Text from "components/text";
import { Checkbox, Slider, StyledSwitcher, StyledCheckbox } from "./styled";
// Types
import { type SwitcherProps } from "./types";

export const Switcher: React.FC<SwitcherProps> = ({
  label,
  checked = false,
  scale = "md",
  disabled = false,
  onChange,
  labelProps,
  ...props
}) => {
  return (
    <StyledCheckbox {...props} disabled={disabled}>
      <StyledSwitcher checked={checked} scale={scale ?? "md"}>
        <Checkbox type="checkbox" checked={checked} disabled={disabled} onChange={onChange} />
        <Slider {...{ checked, disabled, scale }} />
      </StyledSwitcher>

      {typeof label === "string" ? (
        <Text textScale="display2" mx="18px" {...labelProps}>
          {label}
        </Text>
      ) : (
        React.isValidElement(label) && label
      )}
    </StyledCheckbox>
  );
};
