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
  Typography,
  Box,
  CircularProgress,
  IconButton,
} from '@mui/material';
import { Delete as DeleteIcon, Edit as EditIcon } from '@mui/icons-material';
import {
  fetchApplications,
  selectAllApplications,
  selectApplicationsStatus,
  selectApplicationsError,
  deleteApplication,
} from '../../features/applications/applicationsSlice';
import EditApplicationModal from './EditApplicationModal';

const ApplicationsTable = ({ searchFilter = '' }) => {
  const dispatch = useDispatch();
  const applications = useSelector(selectAllApplications);
  const status = useSelector(selectApplicationsStatus);
  const error = useSelector(selectApplicationsError);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  console.log('ApplicationsTable - Current state:', { 
    applications, 
    status, 
    error,
    firstApp: applications[0]
  });

  useEffect(() => {
    if (status === 'idle') {
      dispatch(fetchApplications());
    }
  }, [status, dispatch]);

  if (status === 'loading') {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Typography color="error" sx={{ p: 2 }}>
        Error loading applications: {error}
      </Typography>
    );
  }

  // Filter applications based on search
  const filteredApplications = applications.filter(application => {
    if (!searchFilter) return true;
    
    const searchLower = searchFilter.toLowerCase();
    const company = application.company?.name?.toLowerCase() || '';
    const title = application.title?.toLowerCase() || '';
    
    return company.includes(searchLower) || title.includes(searchLower);
  });

  return (
    <>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Company</TableCell>
              <TableCell>Position</TableCell>
              <TableCell>Employment Type</TableCell>
              <TableCell>Work Mode</TableCell>
              <TableCell>Date Applied</TableCell>
              <TableCell>External ID</TableCell>
              <TableCell align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredApplications.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  <Typography>No applications found</Typography>
                </TableCell>
              </TableRow>
            ) : (
              filteredApplications.map((application) => (
                <TableRow key={application.id}>
                  <TableCell>{application.company?.name || 'N/A'}</TableCell>
                  <TableCell>{application.title}</TableCell>
                  <TableCell>{application.employment_type || 'N/A'}</TableCell>
                  <TableCell>{application.work_mode || 'N/A'}</TableCell>
                  <TableCell>
                    {application.date_submitted
                      ? new Date(application.date_submitted).toLocaleString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: '2-digit',
                          timeZone: 'America/New_York'  // Use Eastern Time
                        })
                      : 'N/A'}
                  </TableCell>
                  <TableCell>{application.job_external_id || 'N/A'}</TableCell>
                  <TableCell align="center">
                    <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1 }}>
                      <IconButton
                        color="primary"
                        size="small"
                        onClick={() => {
                          setSelectedApplication(application);
                          setIsEditModalOpen(true);
                        }}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        color="error"
                        size="small"
                        onClick={async () => {
                          if (window.confirm('Are you sure you want to delete this application?')) {
                            try {
                              await dispatch(deleteApplication(application.id)).unwrap();
                            } catch (err) {
                              console.error('Failed to delete application:', err);
                              window.alert('Failed to delete application: ' + (err.message || 'Unknown error'));
                            }
                          }
                        }}
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

      {selectedApplication && (
        <EditApplicationModal
          open={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setSelectedApplication(null);
          }}
          application={selectedApplication}
          companyName={selectedApplication.company?.name || 'Unknown Company'}
        />
      )}
    </>
  );
};

export default ApplicationsTable;