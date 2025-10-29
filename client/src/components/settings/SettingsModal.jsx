import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  TextField,
  Button,
  Box,
  Alert,
} from '@mui/material';
import ReusableModal from '../common/ReusableModal';
import {
  fetchSettings,
  updateSettings,
  selectSetting,
  selectSettingsStatus,
  selectSettingsError,
  clearSettingsError
} from '../../features/settings/settingsSlice';

const SettingsModal = ({ open, onClose }) => {
  const dispatch = useDispatch();
  const setting = useSelector(selectSetting);
  const status = useSelector(selectSettingsStatus);
  const error = useSelector(selectSettingsError);
  
  const [formData, setFormData] = useState({
    application_monthly_goal: ''
  });
  const [success, setSuccess] = useState('');

  // Fetch settings when modal opens
  useEffect(() => {
    if (open && status === 'idle') {
      dispatch(fetchSettings());
    }
  }, [open, status, dispatch]);

  // Update form when settings are loaded
  useEffect(() => {
    if (setting) {
      setFormData({
        application_monthly_goal: setting.application_monthly_goal || ''
      });
    }
  }, [setting]);

  // Clear error when modal opens
  useEffect(() => {
    if (open) {
      setSuccess('');
      dispatch(clearSettingsError());
    }
  }, [open, dispatch]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async () => {
    setSuccess('');
    
    try {
      const goalValue = formData.application_monthly_goal ? parseInt(formData.application_monthly_goal) : null;
      await dispatch(updateSettings({ application_monthly_goal: goalValue })).unwrap();
      
      setSuccess('Settings updated successfully!');
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err) {
      // Error is handled by Redux state
      console.error('Failed to update settings:', err);
    }
  };

  const isLoading = status === 'loading';

  const modalActions = (
    <>
      <Button onClick={onClose} color="inherit" disabled={isLoading}>
        Cancel
      </Button>
      <Button onClick={handleSubmit} variant="contained" color="primary" disabled={isLoading}>
        {isLoading ? 'Saving...' : 'Save Settings'}
      </Button>
    </>
  );

  return (
    <ReusableModal
      open={open}
      onClose={onClose}
      title="Settings"
      actions={modalActions}
    >
      <Box component="form" noValidate sx={{ mt: 1 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {Array.isArray(error) ? error.join(', ') : error}
          </Alert>
        )}
        
        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {success}
          </Alert>
        )}
        
        <TextField
          margin="normal"
          fullWidth
          id="application_monthly_goal"
          label="Monthly Application Goal"
          name="application_monthly_goal"
          type="number"
          value={formData.application_monthly_goal}
          onChange={handleChange}
          helperText="Set your monthly job application target"
          InputProps={{
            inputProps: { min: 0 }
          }}
        />
      </Box>
    </ReusableModal>
  );
};

export default SettingsModal;
