import styled, { css } from "styled-components";
import { layout, LayoutProps, space, SpaceProps, typography, TypographyProps } from "styled-system";
import { Text } from "components";

interface TdProps extends TypographyProps, SpaceProps, LayoutProps {}
interface TrProps extends LayoutProps {
  hover?: boolean;
}

const getBorderOnHover = ({ hover }: TrProps) => {
  if (hover) {
    return css`
      border-bottom: 1px solid ${({ theme }) => theme.colors.econiaBlue};
      border-top: 1px solid ${({ theme }) => theme.colors.econiaBlue};
    `;
  }
};

export const Table = styled.table`
  table-layout: fixed;

  max-width: 100%;
  width: 100%;

  ${space}
`;

export const Th = styled(Text).attrs({ as: "th", textScale: "bodyLarge" })<TdProps>`
  color: ${({ theme }) => theme.colors.econiaBlue};
  padding: 12px;
  text-align: start;
  position: sticky;
  top: 0;
  background-color: ${({ theme }) => theme.colors.black};
  z-index: 1;
  text-transform: uppercase;
  border-bottom: 1px solid ${({ theme }) => theme.colors.darkGrey};

  &:nth-child(1) {
    padding-inline-start: 24px;

    &:after {
      inset-inline-start: 24px;
    }
  }

  &:nth-last-child(1) {
    padding-inline-end: 24px;
    text-align: end;

    &:after {
      inset-inline-end: 24px;
    }
  }

  ${typography}
  ${space}
`;

export const Tr = styled.tr<TrProps>`
  border-top: 1px solid ${({ theme }) => theme.colors.darkGrey};
  border-right: 1px solid ${({ theme }) => theme.colors.darkGrey};

  &:last-child {
    border-bottom: none;
  }

  &:hover {
    ${getBorderOnHover}
  }

  ${layout}
`;

export const Td = styled.td<TdProps>`
  color: ${({ theme }) => theme.colors.lightGrey};
  padding: 12px;
  vertical-align: middle;
  position: relative;

  &:nth-child(1) {
    padding-inline-start: 24px;

    &:after {
      inset-inline-start: 24px;
    }
  }

  &:nth-last-child(1) {
    padding-inline-end: 24px;

    &:after {
      inset-inline-end: 24px;
    }
  }

  ${typography}
  ${space}
    ${layout}
`;
