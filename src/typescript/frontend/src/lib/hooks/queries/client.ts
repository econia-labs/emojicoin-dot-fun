/* eslint-disable @typescript-eslint/no-throw-literal */
enum ResponseErrorType {
  NOT_FOUND = "Not found",
  UNHANDLED = "Unhandled",
  TOO_MANY_REQUESTS = "Too many requests",
  ACCOUNT_NOT_FOUND = "Account not found",
}

export type ResponseError =
  | { type: ResponseErrorType.NOT_FOUND; message?: string }
  | { type: ResponseErrorType.UNHANDLED; message: string }
  | { type: ResponseErrorType.TOO_MANY_REQUESTS; message?: string }
  | { type: ResponseErrorType.ACCOUNT_NOT_FOUND; message: string };

export async function withResponseError<T>(promise: Promise<T>): Promise<T> {
  return await promise.catch((error) => {
    if (typeof error === "object" && "data" in error) {
      const { data } = error;
      if ("error_code" in data) {
        if (data.error_code === "account_not_found") {
          throw {
            type: ResponseErrorType.ACCOUNT_NOT_FOUND,
            message: data["message"],
          } as ResponseError;
        }
      }
    }
    if (typeof error == "object" && "status" in error) {
      // This is a request!
      error = error as Response;
      if (error.status === 404) {
        throw { type: ResponseErrorType.NOT_FOUND } as ResponseError;
      }
    }
    if (error.message.toLowerCase().includes(ResponseErrorType.TOO_MANY_REQUESTS.toLowerCase())) {
      throw {
        type: ResponseErrorType.TOO_MANY_REQUESTS,
      } as ResponseError;
    }
    throw {
      type: ResponseErrorType.UNHANDLED,
      message: error.toString(),
    } as ResponseError;
  });
}
