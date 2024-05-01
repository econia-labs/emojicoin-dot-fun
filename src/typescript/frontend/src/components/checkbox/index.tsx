import React from "react";

import { StyledCheckbox, StyledInput, CustomCheckbox } from "./styled";
import { CheckIcon } from "components/svg";
import { Text } from "components";

import { CheckboxProps } from "./types";

const Checkbox: React.FC<CheckboxProps> = ({ label, checked, icon, disabled, onChange, ...props }) => {
  return (
    <StyledCheckbox {...props} disabled={disabled}>
      <StyledInput type="checkbox" checked={checked} disabled={disabled} onChange={onChange} />

      <CustomCheckbox checked={checked} disabled={disabled}>
        {checked && icon}
      </CustomCheckbox>

      {typeof label === "string" ? (
        <Text textScale="display6" color="lightGrey" mx="18px">
          {label}
        </Text>
      ) : (
        React.isValidElement(label) && label
      )}
    </StyledCheckbox>
  );
};

Checkbox.defaultProps = {
  icon: <CheckIcon width="16px" />,
};

export default Checkbox;
