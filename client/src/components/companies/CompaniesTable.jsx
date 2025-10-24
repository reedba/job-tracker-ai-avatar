import { useEffect, useState } from 'react';
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
  Typography,
  CircularProgress,
  Box,
  Button,
} from '@mui/material';
import { Star, StarBorder } from '@mui/icons-material';
import { fetchCompanies, updateCompany } from '../../features/companies/companiesSlice';
import AddApplicationModal from '../applications/AddApplicationModal';

const countBadgeStyle = {
  display: 'inline-block',
  minWidth: '24px',
  padding: '4px 8px',
  borderRadius: '12px',
  backgroundColor: 'primary.main',
  color: 'primary.contrastText'
};

const CompaniesTable = () => {
  const dispatch = useDispatch();
  const companiesState = useSelector((state) => state.companies);
  const { items: companies, status, error } = companiesState;
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [isApplicationModalOpen, setIsApplicationModalOpen] = useState(false);

  console.log('Companies State:', companiesState); // Debug log

  const handleOpenApplicationModal = (company) => {
    setSelectedCompany(company);
    setIsApplicationModalOpen(true);
  };

  const handleCloseApplicationModal = () => {
    setSelectedCompany(null);
    setIsApplicationModalOpen(false);
  };

  useEffect(() => {
    dispatch(fetchCompanies());
  }, [dispatch]);

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
        Error loading companies: {error}
      </Typography>
    );
  }

  return (
    <TableContainer component={Paper} sx={{ mt: 2 }}>
      <Table sx={{ minWidth: 650 }} aria-label="companies table">
        <TableHead>
          <TableRow>
            <TableCell>Favorite</TableCell>
            <TableCell>Company Name</TableCell>
            <TableCell>Website</TableCell>
            <TableCell align="center">Applications</TableCell>
            <TableCell align="center">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {companies.map((company) => (
            <TableRow
              key={company.id}
              sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
            >
              <TableCell>
                <IconButton onClick={() => {
                  dispatch(updateCompany({
                    id: company.id,
                    updates: { favorited: !company.favorited }
                  }));
                }}>
                  {company.favorited ? <Star color="primary" /> : <StarBorder />}
                </IconButton>
              </TableCell>
              <TableCell component="th" scope="row">
                {company.name}
              </TableCell>
              <TableCell>
                {company.webpage ? (
                  <a
                    href={company.webpage}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: 'inherit', textDecoration: 'none' }}
                  >
                    {company.webpage}
                  </a>
                ) : (
                  'N/A'
                )}
              </TableCell>
              <TableCell align="center">
                <Typography
                  variant="body2"
                  sx={countBadgeStyle}
                >
                  {company.applications_count || 0}
                </Typography>
              </TableCell>
              <TableCell align="center">
                <Button
                  variant="contained"
                  size="small"
                  onClick={() => handleOpenApplicationModal(company)}
                >
                  Add Application
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {selectedCompany && (
        <AddApplicationModal
          open={isApplicationModalOpen}
          onClose={handleCloseApplicationModal}
          companyId={selectedCompany.id}
          companyName={selectedCompany.name}
        />
      )}
    </TableContainer>
  );
};

export default CompaniesTable;