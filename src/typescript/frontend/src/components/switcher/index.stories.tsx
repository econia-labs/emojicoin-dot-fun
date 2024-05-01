import { useState } from "react";
import { Switcher } from "./";
import Text from "components/text";

export default {
  title: "Components/Switchers",
};

export const Switchers: React.FC = () => {
  const [checked, setChecked] = useState(false);
  const [checked2, setChecked2] = useState(false);
  const [checked3, setChecked3] = useState(false);

  return (
    <>
      <Switcher mb="32px" checked disabled label="Disabled checked" onChange={() => null} />

      <Switcher mb="32px" checked={false} disabled label="Disabled not checked" onChange={() => null} />

      <Switcher
        mb="32px"
        checked={checked}
        label="Size md"
        onChange={() => {
          setChecked(!checked);
        }}
      />

      <Switcher
        mb="32px"
        checked={checked2}
        label={
          <Text ml="6px" textScale="display2">
            Custom label
          </Text>
        }
        onChange={() => {
          setChecked2(!checked2);
        }}
      />

      <Switcher
        mb="32px"
        checked={checked3}
        label="Custom label props"
        labelProps={{ textScale: "display2", color: "blue" }}
        onChange={() => {
          setChecked3(!checked3);
        }}
      />
    </>
  );
};
