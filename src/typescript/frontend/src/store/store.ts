import { AnyAction, Dispatch, Middleware, configureStore } from "@reduxjs/toolkit";
import { TypedUseSelectorHook, useDispatch, useSelector } from "react-redux";
import { createLogger } from "redux-logger";
import { setupListeners } from "@reduxjs/toolkit/dist/query";

import rootReducer from "./rootReducer";

const middleware =
  process.env.NODE_ENV === "development"
    ? [
        createLogger({
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        }) as Middleware<{}, any, Dispatch<AnyAction>>,
      ]
    : [];

const store = configureStore({
  reducer: rootReducer,
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware({
      serializableCheck: false,
    }).concat(middleware),
  devTools: process.env.NODE_ENV === "development",
});

setupListeners(store.dispatch);

export type AppState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<AppState> = useSelector;

export default store;
