import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Box,
  Typography,
  Button,
  CircularProgress
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon, Edit as EditIcon } from '@mui/icons-material';
import {
  fetchContacts,
  deleteContact,
  selectAllContacts,
  selectContactsStatus,
  selectContactsError
} from '../../features/contacts/contactsSlice';
import { fetchCompanies } from '../../features/companies/companiesSlice';
import AddContactModal from './AddContactModal';

const ContactsTable = () => {
  const dispatch = useDispatch();
  const contacts = useSelector(selectAllContacts);
  const status = useSelector(selectContactsStatus);
  const error = useSelector(selectContactsError);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  useEffect(() => {
    if (status === 'idle') {
      dispatch(fetchContacts());
      dispatch(fetchCompanies());
    }
  }, [status, dispatch]);

  const handleDelete = async (contactId) => {
    if (window.confirm('Are you sure you want to delete this contact?')) {
      try {
        await dispatch(deleteContact(contactId)).unwrap();
      } catch (err) {
        console.error('Failed to delete contact:', err);
      }
    }
  };

  const handleModalClose = () => {
    setIsAddModalOpen(false);
    dispatch(fetchContacts());
  };

  if (status === 'loading') {
    return (
      <Box display="flex" justifyContent="center" m={3}>
        <CircularProgress />
      </Box>
    );
  }

  if (status === 'failed') {
    return (
      <Box m={3}>
        <Typography color="error">Error: {error}</Typography>
      </Box>
    );
  }

  return (
    <div>
      <Box mb={2} display="flex" justifyContent="flex-end">
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => setIsAddModalOpen(true)}
        >
          Add Contact
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Company</TableCell>
              <TableCell>Title</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Phone</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {!contacts || contacts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  <Typography>No contacts found</Typography>
                </TableCell>
              </TableRow>
            ) : (
              contacts.map((contact) => (
                <TableRow key={contact.id}>
                  <TableCell>
                    {contact.first_name} {contact.last_name}
                  </TableCell>
                  <TableCell>{contact.company?.name || 'N/A'}</TableCell>
                  <TableCell>{contact.title || 'N/A'}</TableCell>
                  <TableCell>{contact.email}</TableCell>
                  <TableCell>{contact.phone || 'N/A'}</TableCell>
                  <TableCell>
                    <Box display="flex" gap={1}>
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={() => {
                          // TODO: Implement edit functionality
                        }}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDelete(contact.id)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <AddContactModal
        open={isAddModalOpen}
        onClose={handleModalClose}
      />
    </div>
  );
};

export default ContactsTable;