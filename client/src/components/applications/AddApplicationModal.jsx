import { useState } from 'react';
import { useDispatch } from 'react-redux';
import {
  TextField,
  Button,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import ReusableModal from '../common/ReusableModal';
import { createApplication } from '../../features/applications/applicationsSlice';

const initialFormState = {
  title: '',
  job_level: 'mid',
  date_submitted: new Date(),
  employment_type: 'direct_hire',
  work_mode: 'onsite',
  job_posting_url: '',
  job_external_id: ''
};

const AddApplicationModal = ({ open, onClose, companyId, companyName }) => {
  const dispatch = useDispatch();
  const [formData, setFormData] = useState(initialFormState);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleDateChange = (date) => {
    setFormData(prev => ({
      ...prev,
      date_submitted: date
    }));
  };

  const handleSubmit = async () => {
    try {
      await dispatch(createApplication({ 
        companyId, 
        applicationData: {
          ...formData,
          date_submitted: formData.date_submitted.toISOString().split('T')[0]
        }
      })).unwrap();
      
      // Reset form and close modal
      setFormData({ ...initialFormState, date_submitted: new Date() });
      onClose();
    } catch (err) {
      setError(typeof err === 'string' ? err : 'Failed to create application');
    }
  };

  const modalActions = (
    <>
      <Button onClick={onClose} color="inherit">
        Cancel
      </Button>
      <Button onClick={handleSubmit} variant="contained" color="primary">
        Add Application
      </Button>
    </>
  );

  return (
    <ReusableModal
      open={open}
      onClose={onClose}
      title={`Add Application for ${companyName}`}
      actions={modalActions}
    >
      <Box component="form" noValidate sx={{ mt: 1 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        <TextField
          margin="normal"
          required
          fullWidth
          id="title"
          label="Job Title"
          name="title"
          autoFocus
          value={formData.title}
          onChange={handleChange}
        />
        <FormControl fullWidth margin="normal">
          <InputLabel id="job-level-label">Job Level</InputLabel>
          <Select
            labelId="job-level-label"
            id="job_level"
            name="job_level"
            value={formData.job_level}
            onChange={handleChange}
            label="Job Level"
          >
            <MenuItem value="entry">Entry Level</MenuItem>
            <MenuItem value="mid">Mid Level</MenuItem>
            <MenuItem value="senior">Senior Level</MenuItem>
            <MenuItem value="lead">Lead</MenuItem>
            <MenuItem value="manager">Manager</MenuItem>
            <MenuItem value="director">Director</MenuItem>
            <MenuItem value="executive">Executive</MenuItem>
          </Select>
        </FormControl>
        <LocalizationProvider dateAdapter={AdapterDateFns}>
          <DatePicker
            label="Date Submitted"
            value={formData.date_submitted}
            onChange={handleDateChange}
            renderInput={(params) => (
              <TextField {...params} fullWidth margin="normal" required />
            )}
          />
        </LocalizationProvider>
        <FormControl fullWidth margin="normal">
          <InputLabel id="employment-type-label">Employment Type</InputLabel>
          <Select
            labelId="employment-type-label"
            id="employment_type"
            name="employment_type"
            value={formData.employment_type}
            onChange={handleChange}
            label="Employment Type"
          >
            <MenuItem value="direct_hire">Direct Hire</MenuItem>
            <MenuItem value="contractor">Contractor</MenuItem>
          </Select>
        </FormControl>
        <FormControl fullWidth margin="normal">
          <InputLabel id="work-mode-label">Work Mode</InputLabel>
          <Select
            labelId="work-mode-label"
            id="work_mode"
            name="work_mode"
            value={formData.work_mode}
            onChange={handleChange}
            label="Work Mode"
          >
            <MenuItem value="remote">Remote</MenuItem>
            <MenuItem value="hybrid">Hybrid</MenuItem>
            <MenuItem value="onsite">Onsite</MenuItem>
          </Select>
        </FormControl>
        <TextField
          margin="normal"
          fullWidth
          id="job_posting_url"
          label="Job Posting URL"
          name="job_posting_url"
          value={formData.job_posting_url}
          onChange={handleChange}
        />
        <TextField
          margin="normal"
          fullWidth
          id="job_external_id"
          label="Job External ID"
          name="job_external_id"
          value={formData.job_external_id}
          onChange={handleChange}
        />
      </Box>
    </ReusableModal>
  );
};

export default AddApplicationModal;