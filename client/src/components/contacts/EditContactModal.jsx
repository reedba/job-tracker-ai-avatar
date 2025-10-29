import { useState, useEffect } from 'react';
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
import { updateContact } from '../../features/contacts/contactsSlice';

const EditContactModal = ({ open, onClose, contact }) => {
  const dispatch = useDispatch();
  const companies = useSelector(selectAllCompanies);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    title: '',
    linkedin_url: '',
    company_id: null
  });
  const [error, setError] = useState('');
  const [selectedCompany, setSelectedCompany] = useState(null);

  // Populate form when contact prop changes
  useEffect(() => {
    if (contact) {
      setFormData({
        first_name: contact.first_name || '',
        last_name: contact.last_name || '',
        email: contact.email || '',
        phone: contact.phone || '',
        title: contact.title || '',
        linkedin_url: contact.linkedin_url || '',
        company_id: contact.company?.id || null
      });
      
      // Find and set the selected company
      if (contact.company?.id) {
        const company = companies.find(c => c.id === contact.company.id);
        setSelectedCompany(company || null);
      }
    }
  }, [contact, companies]);

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

      await dispatch(updateContact({
        id: contact.id,
        contactData: formData
      })).unwrap();
      
      onClose();
    } catch (err) {
      setError(typeof err === 'string' ? err : 'Failed to update contact');
    }
  };

  const modalActions = (
    <>
      <Button onClick={onClose} color="inherit">
        Cancel
      </Button>
      <Button onClick={handleSubmit} variant="contained" color="primary">
        Update Contact
      </Button>
    </>
  );

  return (
    <ReusableModal
      open={open}
      onClose={onClose}
      title="Edit Contact"
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

        <TextField
          margin="normal"
          fullWidth
          id="linkedin_url"
          label="LinkedIn URL"
          name="linkedin_url"
          value={formData.linkedin_url}
          onChange={handleChange}
        />
      </Box>
    </ReusableModal>
  );
};

export default EditContactModal;
