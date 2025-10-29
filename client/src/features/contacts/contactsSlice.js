import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

export const fetchContacts = createAsyncThunk(
  'contacts/fetchContacts',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/contacts');
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch contacts');
    }
  }
);

export const createContact = createAsyncThunk(
  'contacts/createContact',
  async (contactData, { rejectWithValue }) => {
    try {
      const response = await api.post('/contacts', { contact: contactData });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.errors || 'Failed to create contact');
    }
  }
);

export const updateContact = createAsyncThunk(
  'contacts/updateContact',
  async ({ id, contactData }, { rejectWithValue }) => {
    try {
      const response = await api.patch(`/contacts/${id}`, { contact: contactData });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.errors || 'Failed to update contact');
    }
  }
);

export const deleteContact = createAsyncThunk(
  'contacts/deleteContact',
  async (id, { rejectWithValue }) => {
    try {
      await api.delete(`/contacts/${id}`);
      return id;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to delete contact');
    }
  }
);

const contactsSlice = createSlice({
  name: 'contacts',
  initialState: {
    entities: [],
    status: 'idle',
    error: null
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchContacts.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchContacts.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.entities = action.payload.contacts || [];
        state.error = null;
      })
      .addCase(fetchContacts.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      .addCase(createContact.fulfilled, (state, action) => {
        if (action.payload.contact) {
          state.entities.push(action.payload.contact);
        }
      })
      .addCase(updateContact.fulfilled, (state, action) => {
        const index = state.entities.findIndex(c => c.id === action.payload.contact.id);
        if (index !== -1) {
          state.entities[index] = action.payload.contact;
        }
      })
      .addCase(deleteContact.fulfilled, (state, action) => {
        state.entities = state.entities.filter(c => c.id !== action.payload);
      });
  }
});

export const selectAllContacts = state => state.contacts.entities;
export const selectContactsStatus = state => state.contacts.status;
export const selectContactsError = state => state.contacts.error;

export default contactsSlice.reducer;
