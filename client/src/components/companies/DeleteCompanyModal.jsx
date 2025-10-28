import { useState } from 'react';
import { useDispatch } from 'react-redux';
import {
  Button,
  Box,
  Typography,
  Alert,
} from '@mui/material';
import ReusableModal from '../common/ReusableModal';
import { deleteCompany } from '../../features/companies/companiesSlice';

const DeleteCompanyModal = ({ open, onClose, company }) => {
  const dispatch = useDispatch();
  const [error, setError] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    setError(null);

    try {
      await dispatch(deleteCompany(company.id)).unwrap();
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to delete company');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <ReusableModal
      open={open}
      onClose={onClose}
      title="Delete Company"
      description="Are you sure you want to delete this company?"
    >
      <Box sx={{ p: 2 }}>
        <Typography variant="body1" sx={{ mb: 3 }}>
          This will permanently delete <strong>{company?.name}</strong> and all its associated data. 
          This action cannot be undone.
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
          <Button
            onClick={onClose}
            color="inherit"
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleDelete}
            variant="contained"
            color="error"
            disabled={isDeleting}
          >
            {isDeleting ? 'Deleting...' : 'Delete Company'}
          </Button>
        </Box>
      </Box>
    </ReusableModal>
  );
};

export default DeleteCompanyModal;