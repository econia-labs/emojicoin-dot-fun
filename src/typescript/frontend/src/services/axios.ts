import axios from "axios";

import store from "store/store";
import { hideModal } from "store/modal";

const timeout = 15_000;

export function resetStore() {
  store.dispatch(hideModal());
}

export function getInstance(baseURL = process.env.REACT_APP_API_URL) {
  const instance = axios.create({
    baseURL,
    timeout,
  });

  instance.interceptors.request.use(
    config => {
      return config;
    },
    error => Promise.reject(error),
  );

  instance.interceptors.response.use(
    success => success,
    error => {
      return Promise.reject(error);
    },
  );

  return instance;
}
