import { Textarea as StyledTextarea, Row } from "components";

export default {
  title: "Components/Inputs/Textarea",
};

export const Input: React.FC = () => {
  return (
    <>
      <Row>
        <StyledTextarea m="8px" placeholder="Placeholder..." />
        <StyledTextarea m="8px" value="Disabled" disabled />
      </Row>
    </>
  );
};
