import { useState } from 'react';
import { useDispatch } from 'react-redux';
import {
  Button,
  Box,
  Alert,
  Typography,
} from '@mui/material';
import ReusableModal from '../common/ReusableModal';
import { deleteContact } from '../../features/contacts/contactsSlice';

const DeleteContactModal = ({ open, onClose, contact }) => {
  const dispatch = useDispatch();
  const [error, setError] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!contact) return;
    
    setIsDeleting(true);
    setError('');
    
    try {
      await dispatch(deleteContact(contact.id)).unwrap();
      onClose();
    } catch (err) {
      setError(typeof err === 'string' ? err : 'Failed to delete contact');
    } finally {
      setIsDeleting(false);
    }
  };

  const modalActions = (
    <>
      <Button onClick={onClose} color="inherit" disabled={isDeleting}>
        Cancel
      </Button>
      <Button 
        onClick={handleDelete} 
        variant="contained" 
        color="error"
        disabled={isDeleting}
      >
        {isDeleting ? 'Deleting...' : 'Delete'}
      </Button>
    </>
  );

  return (
    <ReusableModal
      open={open}
      onClose={onClose}
      title="Delete Contact"
      actions={modalActions}
    >
      <Box sx={{ mt: 1 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        <Typography variant="body1" gutterBottom>
          Are you sure you want to delete this contact?
        </Typography>
        
        {contact && (
          <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
              {contact.first_name} {contact.last_name}
            </Typography>
            {contact.company?.name && (
              <Typography variant="body2" color="text.secondary">
                {contact.company.name}
              </Typography>
            )}
            {contact.email && (
              <Typography variant="body2" color="text.secondary">
                {contact.email}
              </Typography>
            )}
          </Box>
        )}
        
        <Typography variant="body2" color="error" sx={{ mt: 2 }}>
          This action cannot be undone.
        </Typography>
      </Box>
    </ReusableModal>
  );
};

export default DeleteContactModal;
