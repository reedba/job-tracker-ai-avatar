import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

export const fetchApplications = createAsyncThunk(
  'applications/fetchApplications',
  async () => {
    try {
      const response = await api.get('/applications');
      console.log('Applications response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching applications:', error);
      throw error;
    }
  }
);

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

const applicationsSlice = createSlice({
  name: 'applications',
  initialState: {
    items: [],
    status: 'idle',
    error: null
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Fetch applications
      .addCase(fetchApplications.pending, (state) => {
        console.log('fetchApplications.pending - Setting status to loading');
        state.status = 'loading';
      })
      .addCase(fetchApplications.fulfilled, (state, action) => {
        console.log('fetchApplications.fulfilled - Received data:', action.payload);
        state.status = 'succeeded';
        state.items = action.payload?.applications || [];
        state.error = null;
      })
      .addCase(fetchApplications.rejected, (state, action) => {
        console.log('fetchApplications.rejected - Error:', action.error);
        state.status = 'failed';
        state.error = action.error.message;
      })
      // Create application
      .addCase(createApplication.fulfilled, (state, action) => {
        state.items.push(action.payload.application);
      })
      // Delete application
      .addCase(deleteApplication.fulfilled, (state, action) => {
        state.items = state.items.filter(app => app.id !== action.payload);
        state.error = null;
      })
      .addCase(deleteApplication.rejected, (state, action) => {
        state.error = action.payload || 'Failed to delete application';
      });
  },
});

export const deleteApplication = createAsyncThunk(
  'applications/deleteApplication',
  async (id, { rejectWithValue }) => {
    try {
      await api.delete(`/applications/${id}`);
      return id;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to delete application');
    }
  }
);

// Selectors
export const selectAllApplications = (state) => state.applications?.items || [];
export const selectApplicationsStatus = (state) => state.applications?.status || 'idle';
export const selectApplicationsError = (state) => state.applications?.error;

export default applicationsSlice.reducer;