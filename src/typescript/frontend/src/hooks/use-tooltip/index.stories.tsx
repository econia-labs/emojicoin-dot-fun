import React from "react";
import styled from "styled-components";

import { Row } from "@/containers";
import { Text } from "components";

import { useTooltip } from "hooks";

export default {
  title: "Hooks/UseTooltips",
};

const StyledBox = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  width: 200px;
  height: 200px;
  margin: 10px;
  border-radius: ${({ theme }) => theme.radii.small};
  background-color: ${({ theme }) => theme.colors.lightGrey};
  cursor: pointer;
`;

export const UseTooltips: React.FC = () => {
  const { targetRef, tooltip } = useTooltip("Custom text");
  const { targetRef: targetText, tooltip: tooltipText } = useTooltip(undefined);
  const { targetRef: targetPosition, tooltip: tooltipPosition } = useTooltip("Top position", { placement: "top" });
  const { targetRef: targetTriggerClick, tooltip: tooltipTriggerClick } = useTooltip("Click me", { trigger: "click" });
  const { targetRef: targetEllipsis, tooltip: tooltipEllipsis } = useTooltip(undefined, { isEllipsis: true });

  return (
    <Row>
      <>
        <StyledBox ref={targetPosition} />
        {tooltipPosition}
      </>

      <>
        <StyledBox ref={targetRef} />
        {tooltip}
      </>

      <>
        <StyledBox ref={targetTriggerClick}>Click Me</StyledBox>
        {tooltipTriggerClick}
      </>

      <>
        <StyledBox ref={targetText}>Hover me</StyledBox>
        {tooltipText}
      </>

      <>
        <StyledBox>
          <Text ref={targetEllipsis} ellipsis>
            Show only if element is ellipsis. Make this text shorter and you will see.
          </Text>
        </StyledBox>
        {tooltipEllipsis}
      </>
    </Row>
  );
};
