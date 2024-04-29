import styled from "styled-components";

import { Button, Heading, Page, Text, Column, Row } from "components";
import { useThemeContext } from "context";

export default {
  title: "Context/ThemeContext",
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
`;

export const ThemeContext = () => {
  const { theme, key, toggleTheme } = useThemeContext();

  return (
    <Page>
      <Heading>Current theme is: {key}</Heading>
      <Button onClick={toggleTheme}>Toggle theme</Button>

      <Column my="12px">
        <Text>Fonts: </Text>

        {Object.values(theme.fonts).map(fontFamily => {
          return (
            <div key={fontFamily}>
              {Object.values(theme.fontWeight).map(fontWeight => {
                return (
                  <Text key={fontWeight} fontFamily={fontFamily} fontWeight={fontWeight}>
                    {fontFamily} {fontWeight}
                  </Text>
                );
              })}
            </div>
          );
        })}
      </Column>

      <Column my="12px">
        <Text>Shadows: </Text>
        <Row>
          {Object.entries(theme.shadows).map(([key, value]) => {
            return (
              <StyledBox key={key} style={{ boxShadow: value }}>
                <Text>{key}</Text>
              </StyledBox>
            );
          })}
        </Row>
      </Column>

      <Column my="12px">
        <Text>Radii: </Text>
        <Row flexWrap="wrap">
          {Object.entries(theme.radii).map(([key, value]) => {
            return (
              <StyledBox key={key} style={{ borderRadius: value }}>
                <Text>{key}</Text>
              </StyledBox>
            );
          })}
        </Row>
      </Column>

      <Column my="12px">
        <Text>Colors: </Text>

        <Row>
          {Object.entries(theme.colors).map(([key, value]) => (
            <StyledBox key={key} style={{ backgroundColor: value }}>
              <Text>{key}</Text>
            </StyledBox>
          ))}
        </Row>
      </Column>
    </Page>
  );
};
