export type ErrorInErrorsArrayFromBE = {
  property: string;
  children: ErrorInErrorsArrayFromBE[];
  constraints: { [key: string]: string };
  value: string;
};

export type ErrorResult = {
  message: string;
  isError: boolean;
  code?: number | string;

  errors?: ErrorInErrorsArrayFromBE[];
};
