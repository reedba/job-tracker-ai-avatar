import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';
import { createApplication } from '../applications/applicationsSlice';

// Async thunks
export const fetchCompanies = createAsyncThunk(
  'companies/fetchCompanies',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/companies');
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const createCompany = createAsyncThunk(
  'companies/createCompany',
  async (companyData, { rejectWithValue }) => {
    try {
      const response = await api.post('/companies', { 
        company: {
          name: companyData.name,
          webpage: companyData.webpage
        } 
      });
      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.errors || error.response?.data?.error || 'Failed to create company';
      return rejectWithValue(errorMessage);
    }
  }
);

export const updateCompany = createAsyncThunk(
  'companies/updateCompany',
  async ({ id, updates }, { rejectWithValue }) => {
    try {
      const response = await api.patch(`/companies/${id}`, { company: updates });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

const companiesSlice = createSlice({
  name: 'companies',
  initialState: {
    items: [],
    status: 'loading', // 'loading' | 'succeeded' | 'failed'
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Fetch companies
      .addCase(fetchCompanies.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchCompanies.fulfilled, (state, action) => {
        state.status = 'succeeded';
        // Handle both array and object responses
        state.items = Array.isArray(action.payload) ? action.payload :
                     action.payload.companies ? action.payload.companies :
                     [];
        console.log('Fetched companies:', state.items); // Debug log
      })
      .addCase(fetchCompanies.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      // Create company
      .addCase(createCompany.fulfilled, (state, action) => {
        state.items.push(action.payload);
      })
      // Update company
      .addCase(updateCompany.fulfilled, (state, action) => {
        const index = state.items.findIndex(company => company.id === action.payload.id);
        if (index !== -1) {
          state.items[index] = action.payload;
        }
      })
      // Handle application creation success
      .addCase(createApplication.fulfilled, (state, action) => {
        if (action.payload.company) {
          const index = state.items.findIndex(c => c.id === action.payload.company.id);
          if (index !== -1) {
            state.items[index] = action.payload.company;
          }
        }
      });
  },
});

export default companiesSlice.reducer;