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
  selectAllContacts,
  selectContactsStatus,
  selectContactsError
} from '../../features/contacts/contactsSlice';
import { fetchCompanies } from '../../features/companies/companiesSlice';
import AddContactModal from './AddContactModal';
import EditContactModal from './EditContactModal';
import DeleteContactModal from './DeleteContactModal';

const ContactsTable = () => {
  const dispatch = useDispatch();
  const contacts = useSelector(selectAllContacts);
  const status = useSelector(selectContactsStatus);
  const error = useSelector(selectContactsError);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedContact, setSelectedContact] = useState(null);

  useEffect(() => {
    if (status === 'idle') {
      dispatch(fetchContacts());
      dispatch(fetchCompanies());
    }
  }, [status, dispatch]);

  const handleDeleteClick = (contact) => {
    setSelectedContact(contact);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteModalClose = () => {
    setIsDeleteModalOpen(false);
    setSelectedContact(null);
    dispatch(fetchContacts());
  };

  const handleModalClose = () => {
    setIsAddModalOpen(false);
    dispatch(fetchContacts());
  };

  const handleEditClick = (contact) => {
    setSelectedContact(contact);
    setIsEditModalOpen(true);
  };

  const handleEditModalClose = () => {
    setIsEditModalOpen(false);
    setSelectedContact(null);
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
              <TableCell>LinkedIn</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {!contacts || contacts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
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
                    {contact.linkedin_url ? (
                      <a href={contact.linkedin_url} target="_blank" rel="noopener noreferrer">
                        View Profile
                      </a>
                    ) : (
                      'N/A'
                    )}
                  </TableCell>
                  <TableCell>
                    <Box display="flex" gap={1}>
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={() => handleEditClick(contact)}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDeleteClick(contact)}
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

      <EditContactModal
        open={isEditModalOpen}
        onClose={handleEditModalClose}
        contact={selectedContact}
      />

      <DeleteContactModal
        open={isDeleteModalOpen}
        onClose={handleDeleteModalClose}
        contact={selectedContact}
      />
    </div>
  );
};

export default ContactsTable;