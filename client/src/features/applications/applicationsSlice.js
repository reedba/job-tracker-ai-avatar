import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

export const createApplication = createAsyncThunk(
  'applications/createApplication',
  async ({ companyId, applicationData }, { rejectWithValue }) => {
    try {
      const response = await api.post(`/companies/${companyId}/applications`, {
        application: applicationData
      });
      return { ...response.data, companyId }; // Include companyId in the response
    } catch (error) {
      const errorMessage = error.response?.data?.errors || error.response?.data?.error || 'Failed to create application';
      return rejectWithValue(errorMessage);
    }
  }
);

export const fetchApplications = createAsyncThunk(
  'applications/fetchApplications',
  async (companyId, { rejectWithValue }) => {
    try {
      const response = await api.get(`/companies/${companyId}/applications`);
      return { companyId, applications: response.data };
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to fetch applications');
    }
  }
);

const applicationsSlice = createSlice({
  name: 'applications',
  initialState: {
    byCompany: {}
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchApplications.fulfilled, (state, action) => {
        state.byCompany[action.payload.companyId] = action.payload.applications;
      })
      .addCase(createApplication.fulfilled, (state, action) => {
        const companyId = action.meta.arg.companyId;
        if (!state.byCompany[companyId]) {
          state.byCompany[companyId] = [];
        }
        state.byCompany[companyId].push(action.payload);
      });
  },
});

export default applicationsSlice.reducer;