import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

export const createApplication = createAsyncThunk(
  'applications/createApplication',
  async ({ companyId, applicationData }, { dispatch, rejectWithValue, getState }) => {
    // Get current application count for optimistic update
    const currentCompany = getState().companies.items.find(c => c.id === companyId);
    const currentCount = currentCompany?.applications_count || 0;

    // Create a new Date object from the submission date and keep full ISO string
    const submissionDate = new Date(applicationData.date_submitted);
    const formattedDate = submissionDate.toISOString();
    
    console.log('Application creation:', {
      originalDate: applicationData.date_submitted,
      submissionDate: submissionDate,
      formattedDate: formattedDate,
      currentCompanyDate: currentCompany?.last_application_date
    });

    // Optimistically update the application count with the formatted date
    dispatch({
      type: 'companies/optimisticUpdateApplicationCount',
      payload: {
        companyId,
        count: currentCount + 1,
        lastApplicationDate: formattedDate
      }
    });

    try {
      const response = await api.post(`/companies/${companyId}/applications`, {
        application: applicationData
      });
      return { ...response.data, companyId };
    } catch (error) {
      // Revert the optimistic update on error
      dispatch({
        type: 'companies/optimisticUpdateApplicationCount',
        payload: {
          companyId,
          count: currentCount,
          lastApplicationDate: currentCompany?.last_application_date
        }
      });
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
        const application = action.payload.application;
        if (application) {
          state.byCompany[companyId].push(application);
        }
      });
  },
});

export default applicationsSlice.reducer;