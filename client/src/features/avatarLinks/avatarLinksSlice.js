import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

export const createAvatarLink = createAsyncThunk(
  'avatarLinks/createAvatarLink',
  async (payload, { rejectWithValue }) => {
    try {
      const response = await api.post('/avatar_links', payload);
      // Expect { id, token, url, expires_at }
      return response.data;
    } catch (err) {
      const errorMessage = err.response?.data?.error || (err.response?.data?.errors && err.response.data.errors.join(', ')) || err.message || 'Failed to create avatar link';
      return rejectWithValue(errorMessage);
    }
  }
);

const avatarLinksSlice = createSlice({
  name: 'avatarLinks',
  initialState: {
    status: 'idle',
    lastCreated: null,
    error: null
  },
  reducers: {
    clearLastCreated: (state) => { state.lastCreated = null; state.error = null; state.status = 'idle'; }
  },
  extraReducers: (builder) => {
    builder
      .addCase(createAvatarLink.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(createAvatarLink.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.lastCreated = action.payload;
        state.error = null;
      })
      .addCase(createAvatarLink.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || action.error.message;
      });
  }
});

export const { clearLastCreated } = avatarLinksSlice.actions;
export default avatarLinksSlice.reducer;
