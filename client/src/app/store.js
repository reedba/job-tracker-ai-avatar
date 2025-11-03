import { configureStore, combineReducers } from '@reduxjs/toolkit';
import authReducer from '../features/auth/authSlice';
import companiesReducer from '../features/companies/companiesSlice';
import applicationsReducer from '../features/applications/applicationsSlice';

// Combine per-slice reducers into an app reducer
const appReducer = combineReducers({
  auth: authReducer,
  companies: companiesReducer,
  applications: applicationsReducer,
});

// Root reducer wrapper: intercept logout (fulfilled) and reset the whole state
const rootReducer = (state, action) => {
  // When the logout thunk completes successfully it dispatches 'auth/logout/fulfilled'.
  // Resetting state to undefined causes each slice reducer to return its initial state.
  if (action?.type === 'auth/logout/fulfilled') {
    state = undefined;
  }
  return appReducer(state, action);
};

export const store = configureStore({
  reducer: rootReducer,
});

export default store;