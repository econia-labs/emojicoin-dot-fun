import { ChangeEvent } from "react";
import { FormikValues, FormikErrors, FormikTouched } from "formik";

export interface FieldProps<Values> {
  value: string;
  name: string;
  multiple?: boolean | undefined;
  checked?: boolean | undefined;
  onChange: (e: ChangeEvent<HTMLInputElement>) => Promise<FormikErrors<Values & FormikValues>> | Promise<void>;
  onBlur: () => Promise<FormikErrors<Values & FormikValues>> | Promise<void>;
  onFocus: () => Promise<FormikErrors<Values & FormikValues>> | Promise<void>;
}

export interface ComponentFormProps<Values> {
  errors: FormikErrors<Values>;
  touched: FormikTouched<Values>;
  isValid: boolean;
  values: Values;
  fieldProps: (field: keyof Values) => FieldProps<Values>;
  handleSubmit: (e?: React.FormEvent<HTMLFormElement> | undefined) => void;
  setFieldValue: <T>(
    field: string,
    value: T,
    shouldValidate?: boolean,
  ) => Promise<void> | Promise<FormikErrors<Values & FormikValues>>;
  setFieldTouched: (
    field: string,
    touched?: boolean,
    shouldValidate?: boolean,
  ) => Promise<FormikErrors<Values>> | Promise<void>;
  setFieldError: (field: string, value: string | undefined) => void;
}
