import React, { useEffect } from 'react';
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
import { Delete as DeleteIcon } from '@mui/icons-material';
import {
  fetchApplications,
  selectAllApplications,
  selectApplicationsStatus,
  selectApplicationsError,
} from '../../features/applications/applicationsSlice';

const ApplicationsTable = () => {
  const dispatch = useDispatch();
  const applications = useSelector(selectAllApplications);
  const status = useSelector(selectApplicationsStatus);
  const error = useSelector(selectApplicationsError);

  console.log('ApplicationsTable - Current state:', { applications, status, error });

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

  return (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Company</TableCell>
            <TableCell>Position</TableCell>
            <TableCell>Employment Type</TableCell>
            <TableCell>Work Mode</TableCell>
            <TableCell>Date Applied</TableCell>
            <TableCell align="center">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {applications.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} align="center">
                <Typography>No applications found</Typography>
              </TableCell>
            </TableRow>
          ) : (
            applications.map((application) => (
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
                <TableCell align="center">
                  <IconButton
                    color="error"
                    size="small"
                    onClick={async () => {
                      if (window.confirm('Are you sure you want to delete this application?')) {
                        try {
                          await dispatch(deleteApplication(application.id)).unwrap();
                          // Optional: Show success message
                        } catch (err) {
                          // Show error message to user
                          console.error('Failed to delete application:', err);
                          window.alert('Failed to delete application: ' + (err.message || 'Unknown error'));
                        }
                      }
                    }}
                  >
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default ApplicationsTable;