import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
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
      // If the response is an object with a companies key, return the array
      if (response.data && Array.isArray(response.data)) {
        return response.data;
      } else if (response.data && typeof response.data === 'object') {
        // If it's just an object, wrap it in an array
        return Array.isArray(response.data.companies) ? response.data.companies : [];
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
      const response = await api.post('/companies', { company: companyData });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to create company');
    }
  }
);

export const updateCompany = createAsyncThunk(
  'companies/updateCompany',
  async ({ id, updates }) => {
    // Transform the updates to match what the Rails API expects
    const apiUpdates = {};
    if (updates.favorited !== undefined) {
      apiUpdates.favorited = updates.favorited;
    }
    if (updates.webpage !== undefined) {
      apiUpdates.webpage = updates.webpage;
    }
    // Add other fields as needed
    const response = await api.patch(`/companies/${id}`, { company: apiUpdates });
    return response.data;
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
      })
      .addCase(fetchCompanies.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.items = action.payload;
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
        // Don't change the status when creating a company
        state.error = null;
      })
      .addCase(createCompany.fulfilled, (state, action) => {
        // Keep the existing status
        state.items = [action.payload, ...state.items];
        state.error = null;
      })
      .addCase(createCompany.rejected, (state, action) => {
        // Keep the existing status on error
        state.error = action.payload || action.error.message;
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