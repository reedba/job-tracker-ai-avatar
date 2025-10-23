import { useState } from 'react';
import { useDispatch } from 'react-redux';
import {
  TextField,
  Button,
  Box,
} from '@mui/material';
import ReusableModal from '../common/ReusableModal';
import { createCompany } from '../../features/companies/companiesSlice';

const AddCompanyModal = ({ open, onClose }) => {
  const dispatch = useDispatch();
  const [formData, setFormData] = useState({
    name: '',
    webpage: ''
  });
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) {
      newErrors.name = 'Company name is required';
    }
    if (formData.webpage && !formData.webpage.match(/^https?:\/\/.+/)) {
      newErrors.webpage = 'Please enter a valid URL starting with http:// or https://';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (validateForm()) {
      try {
        await dispatch(createCompany(formData)).unwrap();
        setFormData({ name: '', webpage: '' });
        onClose();
      } catch (error) {
        setErrors(prev => ({
          ...prev,
          submit: 'Failed to create company. Please try again.'
        }));
      }
    }
  };

  const modalActions = (
    <>
      <Button onClick={onClose} color="inherit">
        Cancel
      </Button>
      <Button onClick={handleSubmit} variant="contained" color="primary">
        Add Company
      </Button>
    </>
  );

  return (
    <ReusableModal
      open={open}
      onClose={onClose}
      title="Add New Company"
      actions={modalActions}
    >
      <Box component="form" noValidate sx={{ mt: 1 }}>
        <TextField
          margin="normal"
          required
          fullWidth
          id="name"
          label="Company Name"
          name="name"
          autoFocus
          value={formData.name}
          onChange={handleChange}
          error={!!errors.name}
          helperText={errors.name}
        />
        <TextField
          margin="normal"
          fullWidth
          id="webpage"
          label="Website URL"
          name="webpage"
          placeholder="https://example.com"
          value={formData.webpage}
          onChange={handleChange}
          error={!!errors.webpage}
          helperText={errors.webpage}
        />
        {errors.submit && (
          <Box color="error.main" textAlign="center" mt={2}>
            {errors.submit}
          </Box>
        )}
      </Box>
    </ReusableModal>
  );
};

export default AddCompanyModal;