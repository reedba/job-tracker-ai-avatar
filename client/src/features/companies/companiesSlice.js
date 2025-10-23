import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

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
      const response = await api.post('/companies', { company: companyData });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
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
    status: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
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
        state.items = action.payload;
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
      });
  },
});

export default companiesSlice.reducer;