import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  TextField,
  Button,
  Box,
  Alert,
  Autocomplete,
} from '@mui/material';
import ReusableModal from '../common/ReusableModal';
import { selectAllCompanies } from '../../features/companies/companiesSlice';
import { createContact } from '../../features/contacts/contactsSlice';

const initialFormState = {
  first_name: '',
  last_name: '',
  email: '',
  phone: '',
  title: '',
  company_id: null
};

const AddContactModal = ({ open, onClose }) => {
  const dispatch = useDispatch();
  const companies = useSelector(selectAllCompanies);
  const [formData, setFormData] = useState(initialFormState);
  const [error, setError] = useState('');
  const [selectedCompany, setSelectedCompany] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCompanyChange = (event, newValue) => {
    setSelectedCompany(newValue);
    setFormData(prev => ({
      ...prev,
      company_id: newValue?.id || null
    }));
  };

  const handleSubmit = async () => {
    try {
      if (!formData.company_id) {
        setError('Please select a company');
        return;
      }

      await dispatch(createContact({
        contactData: formData
      })).unwrap();
      
      // Reset form and close modal
      setFormData(initialFormState);
      setSelectedCompany(null);
      onClose();
    } catch (err) {
      setError(typeof err === 'string' ? err : 'Failed to create contact');
    }
  };

  const modalActions = (
    <>
      <Button onClick={onClose} color="inherit">
        Cancel
      </Button>
      <Button onClick={handleSubmit} variant="contained" color="primary">
        Add Contact
      </Button>
    </>
  );

  return (
    <ReusableModal
      open={open}
      onClose={onClose}
      title="Add New Contact"
      actions={modalActions}
    >
      <Box component="form" noValidate sx={{ mt: 1 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        <Autocomplete
          id="company-select"
          options={companies}
          getOptionLabel={(option) => option.name || ''}
          value={selectedCompany}
          onChange={handleCompanyChange}
          renderInput={(params) => (
            <TextField
              {...params}
              margin="normal"
              required
              fullWidth
              label="Company"
              error={!selectedCompany && error}
            />
          )}
          isOptionEqualToValue={(option, value) => option.id === value.id}
        />

        <TextField
          margin="normal"
          required
          fullWidth
          id="first_name"
          label="First Name"
          name="first_name"
          value={formData.first_name}
          onChange={handleChange}
        />

        <TextField
          margin="normal"
          required
          fullWidth
          id="last_name"
          label="Last Name"
          name="last_name"
          value={formData.last_name}
          onChange={handleChange}
        />

        <TextField
          margin="normal"
          required
          fullWidth
          id="email"
          label="Email"
          name="email"
          type="email"
          value={formData.email}
          onChange={handleChange}
        />

        <TextField
          margin="normal"
          fullWidth
          id="phone"
          label="Phone"
          name="phone"
          value={formData.phone}
          onChange={handleChange}
        />

        <TextField
          margin="normal"
          fullWidth
          id="title"
          label="Title"
          name="title"
          value={formData.title}
          onChange={handleChange}
        />
      </Box>
    </ReusableModal>
  );
};

export default AddContactModal;