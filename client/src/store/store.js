import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../features/auth/authSlice';
import companiesReducer from '../features/companies/companiesSlice';
import applicationsReducer from '../features/applications/applicationsSlice';
import contactsReducer from '../features/contacts/contactsSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    companies: companiesReducer,
    applications: applicationsReducer,
    contacts: contactsReducer,
  },
});
