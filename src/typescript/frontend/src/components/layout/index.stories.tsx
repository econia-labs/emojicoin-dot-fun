import styled from "styled-components";
import { Box, Column, Container, Flex, Text, FlexGap, Page, Heading, Row, RowBetween } from "components";

export default {
  title: "Components/Layout",
};

const Square = styled(Box)`
  width: 100px;
  height: 100px;
  border-radius: 10px;
  background-color: pink;
  margin: 10px;
`;

export const Columns: React.FC = () => {
  return (
    <Column>
      {Array.from({ length: 5 }).map((_, i) => (
        <Square key={i} />
      ))}
    </Column>
  );
};

export const Boxes: React.FC = () => {
  return (
    <Box width="200px" height="200px" $backgroundColor="lightGrey" borderRadius="16px" padding="16px">
      Box with custom props
    </Box>
  );
};

export const Containers: React.FC = () => {
  return (
    <>
      <Container $backgroundColor="lightGrey" height="100vh">
        Container for page content
      </Container>
    </>
  );
};

export const Flexes: React.FC = () => {
  return (
    <>
      <>
        <Text textAlign="center">Flex justify center</Text>
        <Flex justifyItems={{ _: "center", mobile: "end" }} flex={1} justifyContent="center">
          <Square />
        </Flex>
      </>

      <>
        <Text textAlign="center">Flex Gap Row+Column</Text>

        <FlexGap
          rowGap={{ _: "6px", tablet: "24px" }}
          columnGap={{ _: "10px", tablet: "12px" }}
          flexWrap="wrap"
          justifyContent="center"
        >
          {Array.from({ length: 20 }).map((_, i) => (
            <Square m="0px !important" key={i} />
          ))}
        </FlexGap>

        <Text textAlign="center">Flex Gap Gap</Text>

        <FlexGap gap={{ _: "2px", tablet: "24px" }} my="12px" flexWrap="wrap" justifyContent="center">
          {Array.from({ length: 20 }).map((_, i) => (
            <Square m="0px !important" key={i} />
          ))}
        </FlexGap>
      </>
    </>
  );
};

export const Pages: React.FC = () => {
  return (
    <Page>
      <Heading>This is the heading in a page</Heading>
      <Text>You should use Page component in every page</Text>
    </Page>
  );
};

export const Rows: React.FC = () => {
  return (
    <>
      <>
        <Text>Row</Text>
        <Row>
          <Square />

          <Square />
        </Row>
      </>

      <>
        <Text textAlign="center">Row between</Text>
        <RowBetween>
          <Square />

          <Square />
        </RowBetween>
      </>
    </>
  );
};
