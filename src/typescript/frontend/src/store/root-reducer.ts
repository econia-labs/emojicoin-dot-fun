import { combineReducers } from "redux";

import modal from "store/modal";

export const rootReducer = combineReducers({
  [modal.name]: modal.reducer,
});

export default rootReducer;
