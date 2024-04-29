import React from "react";
import { InputGroup as StyledInputGroup, Input } from "components";
import { CloseIcon } from "components/svg";

export default {
  title: "Components/Inputs/InputGroup",
};

export const InputGroup: React.FC = () => {
  return (
    <>
      <StyledInputGroup label="Default">
        <Input />
      </StyledInputGroup>

      <StyledInputGroup label="Fantom" variant="fantom" forId="search">
        <Input id="search" />
      </StyledInputGroup>

      <StyledInputGroup label="With Icons" startIcon={<CloseIcon />} endIcon={<CloseIcon />}>
        <Input />
      </StyledInputGroup>

      <StyledInputGroup label="Label" startIcon={<CloseIcon />} endIcon={<CloseIcon />}>
        <Input defaultValue="Disabled" disabled />
      </StyledInputGroup>

      <StyledInputGroup label="Label" error="Error" isTouched startIcon={<CloseIcon />} endIcon={<CloseIcon />}>
        <Input defaultValue="With Error" />
      </StyledInputGroup>
    </>
  );
};
