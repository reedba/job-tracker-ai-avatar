import { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import {
  TextField,
  Button,
  Box,
} from '@mui/material';
import ReusableModal from '../common/ReusableModal';
import { updateCompany } from '../../features/companies/companiesSlice';

const EditCompanyModal = ({ open, onClose, company }) => {
  const dispatch = useDispatch();
  const [formData, setFormData] = useState({
    name: '',
    webpage: ''
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Update form data when company prop changes
  useEffect(() => {
    if (company) {
      setFormData({
        name: company.name || '',
        webpage: company.webpage || ''
      });
    }
  }, [company]);

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
      setIsSubmitting(true);
      try {
        const updates = {
          name: formData.name.trim(),
          webpage: formData.webpage ? formData.webpage.trim() : null
        };

        console.log('Updating company data:', updates);
        await dispatch(updateCompany({ 
          id: company.id,
          updates
        })).unwrap();
        
        // Close modal after successful update
        onClose();
      } catch (error) {
        console.error('Error updating company:', error);
        const errorMessage = 
          typeof error === 'string' ? error :
          error.errors?.[0] ||
          error.error ||
          'Failed to update company. Please try again.';
        setErrors(prev => ({
          ...prev,
          submit: errorMessage
        }));
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  return (
    <ReusableModal
      open={open}
      onClose={onClose}
      title="Edit Company"
      description="Update the company details below."
    >
      <Box component="form" noValidate>
        <TextField
          autoFocus
          margin="normal"
          fullWidth
          id="name"
          label="Company Name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          error={!!errors.name}
          helperText={errors.name}
          disabled={isSubmitting}
        />
        <TextField
          margin="normal"
          fullWidth
          id="webpage"
          label="Company Website"
          name="webpage"
          value={formData.webpage || ''}
          onChange={handleChange}
          error={!!errors.webpage}
          helperText={errors.webpage || 'Optional: Include http:// or https://'}
          disabled={isSubmitting}
        />
        {errors.submit && (
          <Box sx={{ color: 'error.main', mt: 2, textAlign: 'center' }}>
            {errors.submit}
          </Box>
        )}
        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
          <Button 
            onClick={onClose} 
            color="inherit" 
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            variant="contained" 
            color="primary"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Updating...' : 'Update Company'}
          </Button>
        </Box>
      </Box>
    </ReusableModal>
  );
};

export default EditCompanyModal;