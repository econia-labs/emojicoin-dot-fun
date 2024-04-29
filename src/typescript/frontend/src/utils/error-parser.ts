import { ErrorInErrorsArrayFromBE } from "services/types";

export const parseErrorFromBE = (item: ErrorInErrorsArrayFromBE[]) => {
  const errorsArr: string[] = [];

  const parseError = (item: ErrorInErrorsArrayFromBE[]) => {
    if (item && Object.keys(item[0].constraints).length) {
      const errorMessage = `${item[0].property}: ${item[0].constraints[Object.keys(item[0].constraints)[0]]}`;
      errorsArr.push(errorMessage);
    }

    if (item && item[0].children.length) {
      parseError(item[0].children);
    }
  };

  parseError(item);

  return errorsArr.join(", ");
};
