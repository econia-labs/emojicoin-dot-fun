import styled, { css } from "styled-components";
import { layout, type LayoutProps, space, type SpaceProps, typography, type TypographyProps } from "styled-system";
import { Flex } from "@/containers";
import { Text } from "components/text";

interface TdProps extends TypographyProps, SpaceProps, LayoutProps {}

interface TrProps extends LayoutProps {
  hover?: boolean;
}

const getBorderOnHover = ({ hover }: TrProps) => {
  if (hover) {
    return css`
      border-bottom: 1px solid ${({ theme }) => theme.colors.econiaBlue};
      border-top: 1px solid ${({ theme }) => theme.colors.econiaBlue} !important;
    `;
  }
};

export const Table = styled.table<SpaceProps & LayoutProps>`
  table-layout: fixed;
  max-width: 100%;
  width: 100%;

  ${space}
  ${layout}
`;

export const ThInner = styled(Flex)`
  display: flex;
  padding: 7px;
  border-bottom: 1px solid ${({ theme }) => theme.colors.darkGrey};
`;

export const Th = styled(Text).attrs({ as: "th", textScale: "bodyLarge" })<TdProps>`
  color: ${({ theme }) => theme.colors.econiaBlue};
  position: sticky;
  top: 0;
  background-color: ${({ theme }) => theme.colors.black};
  z-index: 1;
  text-transform: uppercase;

  &:nth-child(1) {
    ${ThInner} {
      padding-inline-start: 21px;
    }
  }

  &:nth-last-child(1) {
    ${ThInner} {
      padding-inline-end: 30px;
      justify-content: end;
    }
  }

  ${typography}
  ${space}
`;

export const Tr = styled.tr<TrProps>`
  border-top: 1px solid ${({ theme }) => theme.colors.darkGrey};
  border-bottom: 1px solid ${({ theme }) => theme.colors.transparent};
  border-right: 1px solid ${({ theme }) => theme.colors.darkGrey};
  display: flex;
  width: 100%;

  &:hover {
    ${getBorderOnHover}
  }

  &:first-child {
    border-top: 1px solid ${({ theme }) => theme.colors.transparent};
  }

  ${layout}
`;

export const TrWrapper = styled(Flex)`
  width: 100%;

  &:last-child {
    ${Tr} {
      border-bottom: none;
    }
  }

  &:first-child {
    ${Tr} {
      border-top: none;
    }
  }
`;

export const Td = styled.td<TdProps>`
  display: inline-block;
  color: ${({ theme }) => theme.colors.lightGrey};
  padding: 7px;
  vertical-align: middle;
  position: relative;

  &:nth-child(1) {
    padding-inline-start: 21px;
  }

  &:nth-last-child(1) {
    padding-inline-end: 21px;
  }

  ${typography}
  ${space}
    ${layout}
`;

export const HeaderTr = styled.tr`
  display: flex;
`;

export const TBody = styled.tbody<LayoutProps>`
  display: flex;
  flex-direction: column;
  overflow: auto;
  width: 100%;

  ${layout}
`;
