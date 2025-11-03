import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { logout } from '../auth/authSlice';
import { createApplication } from '../applications/applicationsSlice';
import api from '../../services/api';

export const fetchCompanies = createAsyncThunk(
  'companies/fetchCompanies',
  async () => {
    console.log('Fetching companies...');
    try {
      const response = await api.get('/companies');
      console.log('Companies response structure:', {
        type: typeof response.data,
        value: response.data,
        keys: Object.keys(response.data),
      });
      
      // Backend returns {companies: [...]}
      if (response.data && response.data.companies && Array.isArray(response.data.companies)) {
        return response.data.companies;
      }
      // Fallback: if response.data is directly an array
      if (Array.isArray(response.data)) {
        return response.data;
      }
      // Fallback to empty array if data structure is unexpected
      return [];
    } catch (error) {
      console.error('Error fetching companies:', error);
      throw error;
    }
  }
);

export const createCompany = createAsyncThunk(
  'companies/createCompany',
  async (companyData, { dispatch, rejectWithValue }) => {
    try {
      console.log('Creating company with data:', companyData);
      
      // Create optimistic entry with temporary ID
      const tempId = `temp-${Date.now()}`;
      const optimisticCompany = {
        id: tempId,
        name: companyData.name,
        webpage: companyData.webpage,
        favorited: false,
        applications_count: 0,
        last_application_date: null,
        location: null,
        notes: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      console.log('Adding optimistic company:', optimisticCompany);
      dispatch(companiesSlice.actions.optimisticAddCompany(optimisticCompany));

      // Create the new company on the server
      const response = await api.post('/companies', { 
        company: {
          name: companyData.name,
          webpage: companyData.webpage
        } 
      });
      
      console.log('Server response:', response.data);
      // Extract the company data from the nested response
      return response.data.company;
    } catch (error) {
      // Get error message from server response
      const errorMessage = error.response?.data?.errors?.[0] || 
                         error.response?.data?.error || 
                         error.message || 
                         'Failed to create company';
      return rejectWithValue({
        error: errorMessage,
        tempId
      });
    }
  }
);

export const updateCompany = createAsyncThunk(
  'companies/updateCompany',
  async ({ id, updates }, { rejectWithValue }) => {
    try {
      console.log('Updating company:', id, 'with data:', updates);
      const response = await api.patch(`/companies/${id}`, { company: updates });
      console.log('Server response:', response.data);
      return response.data.company;
    } catch (error) {
      console.error('Error updating company:', error);
      const errorMessage = error.response?.data?.errors?.[0] || 
                         error.response?.data?.error || 
                         error.message || 
                         'Failed to update company';
      return rejectWithValue(errorMessage);
    }
  }
);

export const deleteCompany = createAsyncThunk(
  'companies/deleteCompany',
  async (id, { rejectWithValue }) => {
    try {
      console.log('Deleting company:', id);
      await api.delete(`/companies/${id}`);
      return id;
    } catch (error) {
      console.error('Error deleting company:', error);
      const errorMessage = error.response?.data?.errors?.[0] || 
                         error.response?.data?.error || 
                         error.message || 
                         'Failed to delete company';
      return rejectWithValue(errorMessage);
    }
  }
);

const companiesSlice = createSlice({
  name: 'companies',
  initialState: {
    items: [],
    status: 'idle',
    error: null
  },
  reducers: {
    optimisticUpdateCompany: (state, action) => {
      const { id, updates } = action.payload;
      const index = state.items.findIndex(company => company.id === id);
      if (index !== -1) {
        state.items[index] = { ...state.items[index], ...updates };
      }
    },
    optimisticUpdateApplicationCount: (state, action) => {
      const { companyId, count, lastApplicationDate } = action.payload;
      const index = state.items.findIndex(company => company.id === companyId);
      if (index !== -1) {
        state.items[index] = {
          ...state.items[index],
          applications_count: count,
          last_application_date: lastApplicationDate
        };
      }
    },
    optimisticAddCompany: (state, action) => {
      state.items.unshift(action.payload);
    },
    removeOptimisticCompany: (state, action) => {
      state.items = state.items.filter(company => company.id !== action.payload);
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch companies
      .addCase(fetchCompanies.pending, (state) => {
        state.status = 'loading';
        // Don't clear items on loading, preserve existing data
      })
      .addCase(fetchCompanies.fulfilled, (state, action) => {
        state.status = 'succeeded';
        // Merge new items with existing ones, avoiding duplicates
        const existingIds = new Set(state.items.map(item => item.id));
        const newItems = action.payload.filter(item => !existingIds.has(item.id));
        state.items = [...state.items, ...newItems];
      })
      .addCase(fetchCompanies.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message;
      })
      // Update company
      .addCase(updateCompany.fulfilled, (state, action) => {
        const index = state.items.findIndex(company => company.id === action.payload.id);
        if (index !== -1) {
          state.items[index] = action.payload;
        }
      })
      // Handle application creation
      .addCase(createApplication.fulfilled, (state, action) => {
        if (action.payload.company) {
          const index = state.items.findIndex(company => company.id === action.payload.company.id);
          if (index !== -1) {
            state.items[index] = action.payload.company;
          }
        }
      })
      // Create company
      .addCase(createCompany.pending, (state) => {
        state.error = null;
      })
      .addCase(createCompany.fulfilled, (state, action) => {
        console.log('Create company fulfilled with payload:', action.payload);
        
        // Find and remove any optimistic entries
        state.items = state.items.filter(item => item.id.toString().indexOf('temp-') === -1);
        
        // Add the new company at the start
        state.items.unshift(action.payload);
        state.error = null;
      })
      .addCase(createCompany.rejected, (state, action) => {
        // Remove any optimistic entries on error
        state.items = state.items.filter(item => item.id.toString().indexOf('temp-') === -1);
        state.error = action.payload?.error || 'Failed to create company';
      })
      // Delete company
      .addCase(deleteCompany.pending, (state) => {
        state.error = null;
      })
      .addCase(deleteCompany.fulfilled, (state, action) => {
        state.items = state.items.filter(company => company.id !== action.payload);
        state.error = null;
      })
      .addCase(deleteCompany.rejected, (state, action) => {
        state.error = action.payload || 'Failed to delete company';
      });

    // Reset companies state on logout to avoid leaking previous user's data
    builder.addCase(logout.fulfilled, (state) => {
      state.items = [];
      state.status = 'idle';
      state.error = null;
    });
  }
});

export const selectAllCompanies = (state) => state.companies.items;
export const selectCompaniesStatus = (state) => state.companies.status;
export const selectCompaniesError = (state) => state.companies.error;

export const { 
  optimisticUpdateCompany,
  optimisticUpdateApplicationCount,
  optimisticAddCompany,
  removeOptimisticCompany
} = companiesSlice.actions;
export default companiesSlice.reducer;