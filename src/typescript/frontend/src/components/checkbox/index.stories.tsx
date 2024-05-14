import React, { useState } from "react";
import Heading from "components/heading";
import Checkbox from "components/checkbox";
import InfoIcon from "components/svg/icons/Info";

export default {
  title: "Components/Checkboxes",
};

export const Checkboxes: React.FC = () => {
  const [isChecked, setIsChecked] = useState(false);
  const [isChecked1, setIsChecked1] = useState(true);
  const [isChecked2, setIsChecked2] = useState(false);
  const [isChecked3, setIsChecked3] = useState(false);

  return (
    <div>
      <div>
        <Checkbox
          mb="32px"
          label="Regular"
          checked={isChecked}
          onChange={() => {
            setIsChecked(!isChecked);
          }}
        />
      </div>

      <div>
        <Checkbox
          mb="32px"
          disabled
          label="Disabled"
          checked={isChecked1}
          onChange={() => {
            setIsChecked1(!isChecked1);
          }}
        />
      </div>
      <div>
        <Checkbox
          mb="32px"
          icon={<InfoIcon color="lightGrey" />}
          label="Custom Icon"
          checked={isChecked2}
          onChange={() => {
            setIsChecked2(!isChecked2);
          }}
        />
      </div>

      <div>
        <Checkbox
          mb="32px"
          label={
            <Heading as="h2" scale="h2" mx="32px">
              Custom Label
            </Heading>
          }
          checked={isChecked3}
          onChange={() => {
            setIsChecked3(!isChecked3);
          }}
        />
      </div>
    </div>
  );
};
