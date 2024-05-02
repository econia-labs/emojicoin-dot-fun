import * as yup from "yup";

import { InitialValues } from "./types";

const useValidationSchema = () => {
  const initialValues: InitialValues = {
    emoji: "",
  };

  const validationSchema = yup.object().shape({
    emoji: yup.string(),
  });

  return { validationSchema, initialValues };
};

export default useValidationSchema;
