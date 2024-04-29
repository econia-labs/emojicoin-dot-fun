import { AxiosResponse, isAxiosError } from "axios";
import { toast } from "react-toastify";

import { getInstance } from "./axios";
import { ErrorResult } from "./types";
import { parseErrorFromBE } from "utils";

import { replaceWithNewErrorMessages } from "./utils";

const axiosInstance = getInstance();

export const makeApiRequest = async <Response>({ isShowError = true, ...config }) => {
  try {
    const result = (await axiosInstance({ ...config })) as AxiosResponse<Response>;

    return result.data;
  } catch (error) {
    const errorObj: ErrorResult = {
      message: "Error",
      isError: true,
    };

    if (isAxiosError(error)) {
      errorObj.code = error.response?.status;

      if (error.response?.data) {
        const data = error.response?.data as { message?: ErrorResult["message"]; errors?: ErrorResult["errors"] };

        if (data.message) {
          errorObj.message = data.message;

          if (data.errors && Array.isArray(data.errors) && data.errors.length) {
            errorObj.message = parseErrorFromBE(data.errors);
          }
        } else {
          errorObj.message = replaceWithNewErrorMessages(error);
        }
      } else {
        errorObj.message = replaceWithNewErrorMessages(error);
      }
    } else if (error instanceof Error && error.message) {
      errorObj.message = replaceWithNewErrorMessages(error);
    }

    if (isShowError) {
      if (errorObj.code !== 401) {
        toast.error(`${errorObj.message}`);
      }
    }

    return errorObj;
  }
};
