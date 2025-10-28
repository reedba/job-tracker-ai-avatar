import { useState, useEffect } from 'react';
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
import { updateApplication } from '../../features/applications/applicationsSlice';

const EditApplicationModal = ({ open, onClose, application, companyName }) => {
  const dispatch = useDispatch();
  const [formData, setFormData] = useState({
    title: '',
    job_level: 'mid',
    date_submitted: new Date(),
    employment_type: 'direct_hire',
    work_mode: 'onsite',
    job_posting_url: '',
    job_external_id: ''
  });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (application) {
      // Convert titlelized values back to snake_case
      const convertEmploymentType = (type) => {
        const typeMap = {
          'Direct Hire': 'direct_hire',
          'Contractor': 'contractor'
        };
        return typeMap[type] || 'direct_hire';
      };

      const convertWorkMode = (mode) => {
        const modeMap = {
          'Remote': 'remote',
          'Hybrid': 'hybrid',
          'Onsite': 'onsite'
        };
        return modeMap[mode] || 'onsite';
      };

      setFormData({
        title: application.title || '',
        job_level: application.job_level || 'mid',
        date_submitted: new Date(application.date_submitted),
        employment_type: convertEmploymentType(application.employment_type),
        work_mode: convertWorkMode(application.work_mode),
        job_posting_url: application.job_posting_url || '',
        job_external_id: application.job_external_id || ''
      });
    }
  }, [application]);

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
    if (!application?.id) return;

    setIsSubmitting(true);
    setError('');

    try {
      const dateToSubmit = formData.date_submitted;
      console.log('Submitting updated application:', {
        originalDate: dateToSubmit,
        isoString: dateToSubmit.toISOString(),
        fullDate: dateToSubmit.toString(),
        employment_type: formData.employment_type,
        work_mode: formData.work_mode,
        fullFormData: formData
      });

      await dispatch(updateApplication({
        companyId: application.company_id,
        applicationId: application.id,
        applicationData: {
          ...formData,
          date_submitted: dateToSubmit.toISOString()
        }
      })).unwrap();
      
      onClose();
    } catch (err) {
      setError(typeof err === 'string' ? err : 'Failed to update application');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ReusableModal
      open={open}
      onClose={onClose}
      title={`Edit Application for ${companyName}`}
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
          value={formData.title}
          onChange={handleChange}
          disabled={isSubmitting}
        />

        <FormControl fullWidth margin="normal">
          <InputLabel id="job-level-label">Job Level</InputLabel>
          <Select
            labelId="job-level-label"
            id="job_level"
            name="job_level"
            value={formData.job_level}
            label="Job Level"
            onChange={handleChange}
            disabled={isSubmitting}
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

        <FormControl fullWidth margin="normal">
          <InputLabel id="employment-type-label">Employment Type</InputLabel>
          <Select
            labelId="employment-type-label"
            id="employment_type"
            name="employment_type"
            value={formData.employment_type}
            label="Employment Type"
            onChange={handleChange}
            disabled={isSubmitting}
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
            label="Work Mode"
            onChange={handleChange}
            disabled={isSubmitting}
          >
            <MenuItem value="onsite">On-site</MenuItem>
            <MenuItem value="hybrid">Hybrid</MenuItem>
            <MenuItem value="remote">Remote</MenuItem>
          </Select>
        </FormControl>

        <LocalizationProvider dateAdapter={AdapterDateFns}>
          <DatePicker
            label="Date Submitted"
            value={formData.date_submitted}
            onChange={handleDateChange}
            renderInput={(params) => (
              <TextField {...params} fullWidth margin="normal" />
            )}
            disabled={isSubmitting}
          />
        </LocalizationProvider>

        <TextField
          margin="normal"
          fullWidth
          id="job_posting_url"
          label="Job Posting URL"
          name="job_posting_url"
          value={formData.job_posting_url}
          onChange={handleChange}
          disabled={isSubmitting}
        />

        <TextField
          margin="normal"
          fullWidth
          id="job_external_id"
          label="External Job ID"
          name="job_external_id"
          value={formData.job_external_id}
          onChange={handleChange}
          disabled={isSubmitting}
        />

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
            {isSubmitting ? 'Updating...' : 'Update Application'}
          </Button>
        </Box>
      </Box>
    </ReusableModal>
  );
};

export default EditApplicationModal;