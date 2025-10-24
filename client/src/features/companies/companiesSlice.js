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