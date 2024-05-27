import styled from "styled-components";

export const Arrow = styled.div`
  width: 10px;
  height: 10px;
  position: absolute;
  top: 50%;
  transform: translateY(-50%) rotate(45deg);
  z-index: -1;
`;

export const StyledMessageInner = styled.div`
  display: flex;
  position: relative;
  padding: 6px;
  border-radius: ${({ theme }) => theme.radii.xSmall};
  margin: 0 7px 11px 7px;
`;

export const StyledMessageWrapper = styled.div`
  display: flex;
  flex-direction: column;
  margin-bottom: 11px;
  max-width: 160px;
  height: fit-content;

  ${({ theme }) => theme.mediaQueries.tablet} {
    max-width: 317px;
  }
`;

export const StyledUserNameWrapper = styled.div`
  display: flex;
`;

export const StyledMessageContainer = styled.div<{ fromAnotherUser: boolean }>`
  display: flex;
  width: 100%;
  justify-content: ${({ fromAnotherUser }) => (fromAnotherUser ? "start" : "end")};

  ${Arrow} {
    background: ${({ theme, fromAnotherUser }) => (fromAnotherUser ? theme.colors.econiaBlue : theme.colors.blue)};
    left: ${({ fromAnotherUser }) => (fromAnotherUser ? "-4px" : undefined)};
    right: ${({ fromAnotherUser }) => (fromAnotherUser ? undefined : "-5px")};
  }

  ${StyledUserNameWrapper} {
    justify-content: ${({ fromAnotherUser }) => (fromAnotherUser ? "start" : "end")};
  }

  ${StyledMessageInner} {
    background-color: ${({ theme, fromAnotherUser }) =>
      fromAnotherUser ? theme.colors.econiaBlue : theme.colors.blue};
  }
`;
