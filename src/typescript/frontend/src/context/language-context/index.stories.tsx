import { useEffect, useState } from "react";

import { useTranslation } from "context";
import { Heading, Page, Text, Box, Row } from "components";

import { fetchLocale } from "./helpers";

export default {
  title: "Context/LanguageContext",
};

export const LanguageContext: React.FC = () => {
  const { currentLanguage } = useTranslation();
  const [locale, setLocale] = useState({});

  useEffect(() => {
    getLocale(currentLanguage.locale);
  }, [currentLanguage.locale]);

  const getLocale = async (locale: string) => {
    const data = await fetchLocale(locale);
    if (data) {
      setLocale(data);
    }
  };

  return (
    <Page>
      <Heading>
        {"Current language is"} {currentLanguage.language}
      </Heading>

      <Box my="12px">
        {Object.entries(locale).map(([key, value]) => (
          <Box key={key}>
            <Row>
              <Text>{key}: </Text>
              <Text ml="10px">{value as string}</Text>
            </Row>
            <hr />
          </Box>
        ))}
      </Box>
    </Page>
  );
};
