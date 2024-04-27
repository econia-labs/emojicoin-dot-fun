import { scales } from "./types";
import { Input as StyledInput, Row } from "components";

export default {
  title: "Components/Inputs/Input",
};

export const Input: React.FC = () => {
  return (
    <>
      {Object.values(scales).map(scale => (
        <Row key={scale}>
          <StyledInput scale={scale} m="8px" placeholder="Placeholder..." />
          <StyledInput scale={scale} m="8px" value="Disabled" disabled />
        </Row>
      ))}
    </>
  );
};
