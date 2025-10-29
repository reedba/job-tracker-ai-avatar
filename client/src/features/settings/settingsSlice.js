import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

// Async thunks
export const fetchSettings = createAsyncThunk(
  'settings/fetchSettings',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/setting');
      return response.data.setting;
    } catch (error) {
      return rejectWithValue(error.response?.data?.errors || 'Failed to fetch settings');
    }
  }
);

export const updateSettings = createAsyncThunk(
  'settings/updateSettings',
  async (settingsData, { rejectWithValue }) => {
    try {
      const response = await api.put('/setting', {
        setting: settingsData
      });
      return response.data.setting;
    } catch (error) {
      return rejectWithValue(error.response?.data?.errors || 'Failed to update settings');
    }
  }
);

const settingsSlice = createSlice({
  name: 'settings',
  initialState: {
    setting: null,
    status: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
    error: null,
  },
  reducers: {
    clearSettingsError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch settings
      .addCase(fetchSettings.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchSettings.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.setting = action.payload;
      })
      .addCase(fetchSettings.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      // Update settings
      .addCase(updateSettings.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(updateSettings.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.setting = action.payload;
      })
      .addCase(updateSettings.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      });
  },
});

export const { clearSettingsError } = settingsSlice.actions;

// Selectors
export const selectSetting = (state) => state.settings.setting;
export const selectSettingsStatus = (state) => state.settings.status;
export const selectSettingsError = (state) => state.settings.error;

export default settingsSlice.reducer;
