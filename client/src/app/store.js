import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../features/auth/authSlice';
import companiesReducer from '../features/companies/companiesSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    companies: companiesReducer,
  },
});

export default store;